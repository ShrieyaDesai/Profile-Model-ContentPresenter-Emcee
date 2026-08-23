# Adding Photos — Quick Guide

Two steps, always: **(1)** put the image file in the right folder, **(2)** list its filename in the matching Google Sheet tab. The site only shows photos it's told about — dropping a file into a folder alone isn't enough.

Then push the photo file to GitHub (`git add . && git commit -m "Add photos" && git push`, or just drag the file into the folder on github.com — no local commands needed either way). Sheet changes need no push at all.

## 1. Main profile photo
Add **one** image to `photos/` (no sub-folder), then set **Main Photo Filename** in the **Profile** tab to that filename (e.g. `main.jpg`).
→ Shows in the About section.

## 2. General gallery photos
Add images to `photos/gallery/`, then add one row per photo (just the filename) to the **Gallery** tab.
→ Shown in the Gallery section, in the order the rows appear — put newest at the top.

## 3. Event/project photos
Add images to `photos/events/<folder-name>/`, where `<folder-name>` matches that row's **Photos Folder** column in the **Events** tab. Then list those filenames in that row's **Photos** column, separated by `;` — e.g. `cover.jpg;photo2.jpg`.
→ Shown in that project's "Show More" pop-up, and automatically in the Gallery section too, tagged with its Event Type.

Set a thumbnail with the **Cover Photo** column (must be one of the filenames you listed in Photos). Leave blank to auto-use the first one.

## Formats
`.jpg` `.jpeg` `.png` `.gif` `.webp` `.avif`

Full sheet setup: see `GOOGLE_SHEETS_SETUP.md`.
