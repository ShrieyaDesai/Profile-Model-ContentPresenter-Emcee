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

  /* ---------------- shared: list every image in the repo's photos/ tree ---------------- */
  /* One request for the whole repo file tree (instead of one request per
     folder) — used for both the Gallery section and each event's Photos
     Folder, no manual filename list needed, whatever's in the folder on
     GitHub shows up.
     Tried in order: jsDelivr's CDN-backed package API first (no per-visitor
     rate limit, so it doesn't go dark for people on a shared/office network),
     falling back to GitHub's raw API (fresher, but capped at 60 unauthenticated
     requests/hour per visitor IP — the old source of "photos silently vanish"
     reports) if jsDelivr is unreachable or hasn't picked up the repo yet. */
  const GALLERY_IMAGE_RE = /\.(jpe?g|png|gif|webp|avif)$/i;

  async function fetchImagePathsFromJsDelivr(repo) {
    const url = `https://data.jsdelivr.com/v1/packages/gh/${repo}@main?structure=flat`;
    let res;
    try {
      res = await fetch(url, { cache: "no-store" });
    } catch (err) {
      console.warn("Couldn't reach jsDelivr to list repo files — falling back to GitHub's API", err);
      return null;
    }
    if (!res.ok) {
      console.warn(`jsDelivr returned HTTP ${res.status} listing the repo's file tree — falling back to GitHub's API`);
      return null;
    }
    const data = await res.json();
    if (!Array.isArray(data.files)) return null;
    return data.files
      .map((f) => f.name.replace(/^\//, ""))
      .filter((path) => GALLERY_IMAGE_RE.test(path));
  }

  async function fetchImagePathsFromGitHub(repo) {
    const url = `https://api.github.com/repos/${repo}/git/trees/main?recursive=1`;
    let res;
    try {
      res = await fetch(url, { headers: { Accept: "application/vnd.github+json" }, cache: "no-store" });
    } catch (err) {
      console.warn("Couldn't reach GitHub to list repo files", err);
      return [];
    }
    if (!res.ok) {
      console.warn(`GitHub returned HTTP ${res.status} listing the repo's file tree — check js/sheets-config.js "githubRepo" is set to "owner/repo", and that its default branch is "main".`);
      return [];
    }
    const data = await res.json();
    if (!Array.isArray(data.tree)) return [];
    return data.tree
      .filter((item) => item.type === "blob" && GALLERY_IMAGE_RE.test(item.path))
      .map((item) => item.path);
  }

  async function fetchRepoImagePaths(repo) {
    if (!repo) return [];
    const viaJsDelivr = await fetchImagePathsFromJsDelivr(repo);
    if (viaJsDelivr) return viaJsDelivr;
    return fetchImagePathsFromGitHub(repo);
  }

  function imageNamesUnder(paths, folderPath) {
    return paths
      .filter((p) => p.startsWith(folderPath) && !p.slice(folderPath.length).includes("/"))
      .map((p) => p.slice(folderPath.length));
  }

  async function fetchPhotosFromGitHub(repo, eventFolders) {
    const paths = await fetchRepoImagePaths(repo);
    const gallery = imageNamesUnder(paths, "photos/gallery/")
      .sort((a, b) => b.localeCompare(a))
      .map((name) => ({ src: `photos/gallery/${encodeURIComponent(name)}` }));
    const folderPhotosMap = {};
    eventFolders.forEach((folder) => {
      folderPhotosMap[folder] = imageNamesUnder(paths, `photos/events/${folder}/`).sort((a, b) => a.localeCompare(b));
    });
    return { gallery, folderPhotosMap };
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

    const [profileRows, eventRows] = await Promise.all([
      fetchTab("Profile", cfg.profile),
      fetchTab("Events", cfg.events)
    ]);

    const eventFolders = [...new Set(eventRows.map((r) => (r["Photos Folder"] || "").trim()).filter(Boolean))];
    const { gallery, folderPhotosMap } = await fetchPhotosFromGitHub(cfg.githubRepo, eventFolders);

    return {
      profile: buildProfile(profileRows),
      events: buildEvents(eventRows, folderPhotosMap),
      gallery
    };
  };
})();
