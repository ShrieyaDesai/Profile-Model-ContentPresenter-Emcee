/*
  Fetches profile/events/gallery data live from the published Google
  Sheet (see js/sheets-config.js) and shapes it into the same
  {profile, events, gallery} structure script.js renders. No build
  step — edit the sheet, the site picks it up on next page load.
*/

window.loadSiteData = (function () {
  const ALLOWED_TYPES = ["Acting", "Dance", "Modelling", "Presenting", "Hosting", "Podcast"];
  const GROUP_OF_TYPE = {
    acting: "adm", dance: "adm", modelling: "adm",
    presenting: "presenter",
    hosting: "hosting", podcast: "hosting"
  };

  /* ---------------- CSV parsing (same algorithm as the old build script) ---------------- */
  function parseCSV(text) {
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;
    text = text.replace(/^﻿/, "");

    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else inQuotes = false;
        } else field += c;
      } else if (c === '"') inQuotes = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\r") { /* skip */ }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else field += c;
    }
    if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
    return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
  }

  function rowsToObjects(rows) {
    if (rows.length === 0) return [];
    const headers = rows[0].map((h) => h.trim());
    return rows.slice(1).map((r) => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = (r[i] || "").trim(); });
      return obj;
    });
  }

  async function fetchTab(name, source) {
    const url = `https://docs.google.com/spreadsheets/d/e/${source.publishedId}/pub?gid=${source.gid}&single=true&output=csv`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`"${name}" sheet fetch failed (HTTP ${res.status})`);
    const text = await res.text();
    if (/^\s*<(!DOCTYPE|html)/i.test(text)) {
      throw new Error(`"${name}" sheet: got an HTML page instead of CSV — it likely isn't published yet, or its publishedId/gid in js/sheets-config.js is wrong.`);
    }
    if (text.trim() === "") {
      throw new Error(`"${name}" sheet came back empty — paste the starter data from GOOGLE_SHEETS_SETUP.md into that tab.`);
    }
    return rowsToObjects(parseCSV(text));
  }

  /* ---------------- profile ---------------- */
  function buildProfile(rows) {
    const map = {};
    rows.forEach((r) => { if (r.Field) map[r.Field.trim()] = r.Value || ""; });

    const languages = (map["Languages"] || "").split(",").map((s) => s.trim()).filter(Boolean);

    const stats = [];
    if (languages.length) stats.push({ value: String(languages.length), label: "Languages Spoken" });
    for (let n = 1; n <= 4; n++) {
      const label = map[`Highlight ${n}`];
      if (label) stats.push({ value: null, label });
    }

    const mainPhotoFile = map["Main Photo Filename"] || "";

    return {
      name: map["Name"] || "Your Name",
      role: map["Role"] || "",
      age: map["Age"] || "",
      location: map["Location"] || "",
      languages,
      email: map["Email"] || "",
      phone: map["Phone"] || "",
      instagramHandle: map["Instagram Handle"] || "",
      instagramUrl: map["Instagram URL"] || "",
      hero: {
        kicker: map["Hero Kicker"] || "",
        titleLead: map["Hero Title Lead"] || "",
        titleAccent: map["Hero Title Accent"] || "",
        subtitle: map["Hero Subtitle"] || "",
        description: map["Hero Description"] || ""
      },
      about: {
        paragraphs: [map["About Paragraph 1"], map["About Paragraph 2"]].filter(Boolean)
      },
      stats,
      footerNote: map["Footer Note"] || "",
      mainPhoto: mainPhotoFile ? `photos/${mainPhotoFile}` : null
    };
  }

  /* ---------------- YouTube helper ---------------- */
  function extractYouTubeId(url) {
    if (!url) return null;
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtu\.be\/)([\w-]{11})/);
    return m ? m[1] : null;
  }

  /* ---------------- events ---------------- */
  function buildEvents(rows) {
    return rows
      .filter((r) => r["Event Name"])
      .map((r) => {
        const rawType = (r["Event Type"] || "").trim();
        const matchedType = ALLOWED_TYPES.find((t) => t.toLowerCase() === rawType.toLowerCase());
        if (rawType && !matchedType) {
          console.warn(`Event "${r["Event Name"]}" has Event Type "${rawType}" — expected one of: ${ALLOWED_TYPES.join(", ")}. It will show in the Gallery but not in the Portfolio sections.`);
        }
        const type = matchedType || rawType;
        const folder = (r["Photos Folder"] || "").trim();
        const photoFiles = (r["Photos"] || "").split(";").map((s) => s.trim()).filter(Boolean);
        const photos = folder ? photoFiles.map((f) => `photos/events/${folder}/${f}`) : [];

        const coverName = (r["Cover Photo"] || "").trim();
        let coverSrc = null;
        if (coverName && folder) {
          coverSrc = `photos/events/${folder}/${coverName}`;
          if (!photoFiles.includes(coverName)) {
            console.warn(`Event "${r["Event Name"]}" has Cover Photo "${coverName}" but it's not listed in that row's Photos column.`);
          }
        } else if (photos.length) {
          coverSrc = photos[0];
        }

        const description = (r["Description"] || "").trim();
        const bullets = description
          ? description.split(/\r\n|\r|\n/).flatMap((line) => line.split(/\s*\|\s*/)).map((s) => s.trim()).filter(Boolean)
          : [];

        const tags = (r["Tags"] || "").split(",").map((s) => s.trim()).filter(Boolean);
        const videoUrl = (r["Video Link"] || "").trim();
        const reels = (r["Reel Links"] || "").split(/[;\n]/).map((s) => s.trim()).filter(Boolean);

        return {
          name: r["Event Name"].trim(),
          type,
          subtitle: (r["Subtitle"] || "").trim() || type,
          tags: tags.length ? tags : (type ? [type] : []),
          folder,
          photos,
          coverSrc,
          videoUrl: videoUrl || null,
          videoId: extractYouTubeId(videoUrl),
          reels,
          bullets,
          group: GROUP_OF_TYPE[type.toLowerCase()] || null
        };
      });
  }

  /* ---------------- gallery ---------------- */
  function buildGallery(rows) {
    return rows
      .filter((r) => r["Filename"])
      .map((r) => ({ src: `photos/gallery/${r["Filename"].trim()}` }));
  }

  /* ---------------- public entry point ---------------- */
  function isConfigured(cfg, key) {
    return !!(cfg[key] && cfg[key].publishedId && !cfg[key].publishedId.startsWith("PASTE_"));
  }

  return async function loadSiteData() {
    const cfg = window.SHEETS_CONFIG || {};
    // Profile and Events are required; Gallery is optional — if it isn't
    // set up yet, the site still works with an empty gallery instead of
    // failing entirely.
    const missing = ["profile", "events"].filter((k) => !isConfigured(cfg, k));
    if (missing.length) {
      throw new Error(`js/sheets-config.js isn't fully set up yet (missing: ${missing.join(", ")}) — see GOOGLE_SHEETS_SETUP.md.`);
    }

    const [profileRows, eventRows, galleryRows] = await Promise.all([
      fetchTab("Profile", cfg.profile),
      fetchTab("Events", cfg.events),
      isConfigured(cfg, "gallery") ? fetchTab("Gallery", cfg.gallery) : Promise.resolve([])
    ]);

    return {
      profile: buildProfile(profileRows),
      events: buildEvents(eventRows),
      gallery: buildGallery(galleryRows)
    };
  };
})();
