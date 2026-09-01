# Adding Photos — Quick Guide

Push the photo file to GitHub (`git add . && git commit -m "Add photos" && git push`, or just drag the file into the folder on github.com — no local commands needed either way).

## 1. Main profile photo
Add **one** image to `photos/` (no sub-folder), then set **Main Photo Filename** in the **Profile** sheet tab to that filename (e.g. `main.jpg`).
→ Shows in the About section.

## 2. General gallery photos
Just add images to `photos/gallery/` and push. That's it — no listing needed anywhere. The site reads that folder's contents straight from GitHub automatically.
→ Shown in the Gallery section, sorted by filename (Z→A). To control order, name files so that sort works the way you want (e.g. `2026-01-05-photo.jpg`, `2026-01-02-photo.jpg`).

## 3. Event/project photos
Add images to `photos/events/<folder-name>/`, where `<folder-name>` matches that row's **Photos Folder** column in the **Events** sheet tab. That's it — no filenames to list anywhere, the site reads that folder's contents straight from GitHub automatically.
→ Shown in that project's "Show More" pop-up, and automatically in the Gallery section too, tagged with its Event Type.

Optionally set a thumbnail with the **Cover Photo** column (the exact filename of one photo in that folder, e.g. `photo123.jpg`). Leave blank to auto-use the first one found in the folder.

## Formats
`.jpg` `.jpeg` `.png` `.gif` `.webp` `.avif`

Full sheet setup: see `GOOGLE_SHEETS_SETUP.md`.
