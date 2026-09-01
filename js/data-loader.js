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
      mainPhoto: mainPhotoFile ? `photos/${encodeURIComponent(mainPhotoFile)}` : null
    };
  }

  /* ---------------- YouTube helper ---------------- */
  function extractYouTubeId(url) {
    if (!url) return null;
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtu\.be\/)([\w-]{11})/);
    return m ? m[1] : null;
  }

  /* ---------------- events ---------------- */
  function buildEvents(rows, folderPhotosMap) {
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
        const photoFiles = folder ? (folderPhotosMap[folder] || []) : [];
        const photos = photoFiles.map((f) => `photos/events/${folder}/${encodeURIComponent(f)}`);

        const coverName = (r["Cover Photo"] || "").trim();
        let coverSrc = null;
        if (coverName && folder) {
          coverSrc = `photos/events/${folder}/${encodeURIComponent(coverName)}`;
          if (!photoFiles.includes(coverName)) {
            console.warn(`Event "${r["Event Name"]}" has Cover Photo "${coverName}" but no file with that name was found in photos/events/${folder}/ on GitHub.`);
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

  /* ---------------- shared: list image filenames in a GitHub repo folder ---------------- */
  /* Used for both the Gallery section and each event's Photos Folder — no
     manual filename list needed, whatever's in the folder on GitHub shows up. */
  const GALLERY_IMAGE_RE = /\.(jpe?g|png|gif|webp|avif)$/i;

  async function listImagesFromGitHub(repo, path) {
    if (!repo) return [];
    const url = `https://api.github.com/repos/${repo}/contents/${path}`;
    let res;
    try {
      res = await fetch(url, { headers: { Accept: "application/vnd.github+json" }, cache: "no-store" });
    } catch (err) {
      console.warn(`Couldn't reach GitHub to list ${path}/`, err);
      return [];
    }
    if (!res.ok) {
      if (res.status !== 404) {
        console.warn(`GitHub returned HTTP ${res.status} for ${path}/ — check js/sheets-config.js "githubRepo" is set to "owner/repo".`);
      }
      return [];
    }
    const items = await res.json();
    if (!Array.isArray(items)) return [];
    return items
      .filter((item) => item.type === "file" && GALLERY_IMAGE_RE.test(item.name))
      .map((item) => item.name);
  }

  async function fetchGalleryFromGitHub(repo) {
    const names = await listImagesFromGitHub(repo, "photos/gallery");
    return names
      .sort((a, b) => b.localeCompare(a))
      .map((name) => ({ src: `photos/gallery/${encodeURIComponent(name)}` }));
  }

  async function fetchEventFolderPhotos(repo, folders) {
    const entries = await Promise.all(
      folders.map(async (folder) => [folder, (await listImagesFromGitHub(repo, `photos/events/${folder}`)).sort((a, b) => a.localeCompare(b))])
    );
    return Object.fromEntries(entries);
  }

  /* ---------------- public entry point ---------------- */
  function isConfigured(cfg, key) {
    return !!(cfg[key] && cfg[key].publishedId && !cfg[key].publishedId.startsWith("PASTE_"));
  }

  return async function loadSiteData() {
    const cfg = window.SHEETS_CONFIG || {};
    // Profile and Events (Google Sheets) are required; the gallery photo
    // list comes straight from GitHub instead and just degrades to empty
    // if unreachable, rather than failing the whole page.
    const missing = ["profile", "events"].filter((k) => !isConfigured(cfg, k));
    if (missing.length) {
      throw new Error(`js/sheets-config.js isn't fully set up yet (missing: ${missing.join(", ")}) — see GOOGLE_SHEETS_SETUP.md.`);
    }

    const [profileRows, eventRows, gallery] = await Promise.all([
      fetchTab("Profile", cfg.profile),
      fetchTab("Events", cfg.events),
      fetchGalleryFromGitHub(cfg.githubRepo)
    ]);

    const folders = [...new Set(eventRows.map((r) => (r["Photos Folder"] || "").trim()).filter(Boolean))];
    const folderPhotosMap = await fetchEventFolderPhotos(cfg.githubRepo, folders);

    return {
      profile: buildProfile(profileRows),
      events: buildEvents(eventRows, folderPhotosMap),
      gallery
    };
  };
})();
