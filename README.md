# Portfolio Site

A static portfolio — Acting, Dance, Modelling, Content Presenting, Hosting & Podcast — with a photo/video/reel gallery. Text and event data are edited live in a Google Sheet (no build step); photos are files in this repo. Plain HTML/CSS/JS.

**First time here?** See `GOOGLE_SHEETS_SETUP.md` — you need to do that one-time setup before the site has any content.

## How it fits together

```
index.html                 Home page: name, about, gallery, contact
portfolio.html              Portfolio page: Acting/Dance/Modelling, Content Presenter, Hosts & Podcast
css/style.css               all styling / the theme (shared by both pages)
js/content.js                static microcopy (section labels/headings — rarely changes)
js/sheets-config.js          <-- EDIT ONCE: your Google Sheet's published ID + tab gids
js/data-loader.js            fetches + parses the sheet at page load — no need to touch
js/script.js                 renders everything — no need to touch

photos/
  main.jpg                    <-- your main profile photo, no sub-folder
  gallery/                     <-- drop photos here; listed (and ordered) in the Gallery sheet tab
  events/
    <folder-name>/             <-- one folder per event, matching "Photos Folder" in the Events tab
```

**There's no build step for text/data anymore.** Edit your Google Sheet, wait about a minute (Google's publish cache), refresh the live page. See `GOOGLE_SHEETS_SETUP.md` for the sheet structure and `ADDING_PHOTOS.md` for photos.

## Previewing locally

Because the page now fetches live data from Google, opening `index.html` by double-clicking won't work (browsers block that kind of request from a `file://` page). Run a local server instead:
```
npx serve .
```
then open the URL it prints.

## Hosting on GitHub Pages

1. Create a new repository on GitHub (e.g. `my-portfolio`).
2. In this folder, run:
   ```
   git init
   git add .
   git commit -m "Initial portfolio"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```
3. On GitHub: repo → **Settings → Pages** → Source: **Deploy from a branch**, Branch: **main / (root)** → Save.
4. Live at `https://<your-username>.github.io/<repo-name>/` within a minute or two.

From then on, you only need `git push` when you **add/remove a photo file**. Text and event edits happen entirely in the Google Sheet and need no git action at all.

## Customizing the design

Colors, fonts and spacing are CSS variables at the top of `css/style.css` (`:root { ... }`) — change `--accent`, `--accent-2`, `--accent-3` for a different palette, or swap the Google Fonts links in `index.html`'s `<head>` for different typefaces.
