/*
  =============================================================
  ONE-TIME SETUP — see GOOGLE_SHEETS_SETUP.md for full steps.

  Profile and Events each need a "publishedId" + "gid":
  1. Open the sheet -> File -> Share -> Publish to web.
  2. Pick that sheet/tab, format "Comma-separated values (.csv)",
     click Publish, copy the link it gives you. It looks like:
     https://docs.google.com/spreadsheets/d/e/THIS-PART/pub?gid=0...
  3. Paste that long ID (and the gid= number) below.
  4. Save this file and push it to GitHub.

  Gallery is different — no Sheet needed. The site reads that
  folder's contents straight from GitHub, so it just needs to know
  which repo to look at ("owner/repo-name", from your repo's URL).
  =============================================================
*/

window.SHEETS_CONFIG = {
  profile: {
    publishedId: "2PACX-1vTOam2i4yBbIjmTtUN735oUzGlxQPjdT3yoMj7xWrYzqmNpLPPNwsa7HP6UfVJhhYAY796JnihhSjtn",
    gid: "0"
  },
  events: {
    publishedId: "2PACX-1vTOam2i4yBbIjmTtUN735oUzGlxQPjdT3yoMj7xWrYzqmNpLPPNwsa7HP6UfVJhhYAY796JnihhSjtn",
    gid: "1203963429"
  },
  githubRepo: "ShrieyaDesai/Profile-Model-ContentPresenter-Emcee"
};
