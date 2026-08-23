/*
  =============================================================
  ONE-TIME SETUP — see GOOGLE_SHEETS_SETUP.md for full steps.

  Each of the 3 rows below needs its own "publishedId" + "gid",
  whether Profile/Events/Gallery are 3 tabs in one spreadsheet or
  3 separate spreadsheets — same idea either way:

  1. Open the sheet -> File -> Share -> Publish to web.
  2. Pick that sheet/tab, format "Comma-separated values (.csv)",
     click Publish, copy the link it gives you. It looks like:
     https://docs.google.com/spreadsheets/d/e/THIS-PART/pub?gid=0...
  3. Paste that long ID (and the gid= number) below.
  4. Save this file and push it to GitHub.

  Gallery is optional — leave it as PASTE_... until you set one up;
  the site works fine with just Profile + Events.
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
  gallery: {
    publishedId: "PASTE_GALLERY_PUBLISHED_ID_HERE",
    gid: "0"
  }
};
