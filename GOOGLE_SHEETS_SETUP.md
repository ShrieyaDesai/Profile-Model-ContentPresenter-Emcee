# Google Sheets Setup (one-time)

Your profile info and projects live in a Google Sheet instead of a local file. Edit the sheet → the live site picks it up automatically on next page load. No build step, no git push needed for text/data changes (photos themselves still need to be pushed to GitHub — see `ADDING_PHOTOS.md`).

(The Gallery section doesn't use a Sheet at all — it reads `photos/gallery/` straight from your GitHub repo. Nothing to set up there beyond adding photos and pushing.)

## Step 1 — Create the sheet(s)

Either works, pick whichever you prefer:
- **One spreadsheet, 2 tabs** named `Profile` and `Events`, or
- **2 separate spreadsheets**, one per data type

Each needs to be published individually either way (Step 3), so there's no real difference in effort.

## Step 2 — Paste in the starter data

Click cell A1 on the right sheet/tab and paste the matching block below (select the whole block including the header row).

### Profile tab
```
Field	Value
Name	Shrieya Desai
Role	Actress · Dancer · Model · Content Presenter · Host
Age	21
Location	Bengaluru
Languages	Tamil, Kannada, Hindi, English
Email	desaishrieya@gmail.com
Phone	+91 8500849147
Instagram Handle	@desai._.shrieya
Instagram URL	https://instagram.com/desai._.shrieya
Hero Kicker	From Spotlight To Mic · Multilingual Talent · Based In Bangalore
Hero Title Lead	Commanding Every
Hero Title Accent	Stage & Screen
Hero Subtitle	Actress · Dancer · Model · Host
Hero Description	Emotional range on-camera, high-energy screen presence, and comfort across editorial, ethnic & commercial styles.
About Paragraph 1	I'm a Bengaluru-based actress, dancer and model working across Tamil, Kannada, Hindi and English — moving comfortably between screen performance, choreography, editorial modelling and on-camera brand presenting.
About Paragraph 2	From lead roles in music videos to hosting brand launch events, my focus is always the same: clear, confident, emotionally honest work in front of the camera or a live audience.
Highlight 1	Live Events
Highlight 2	Projects & Campaigns
Highlight 3	Brand Presentations
Main Photo Filename	main.jpg
Footer Note	Designed & built with care.
```
One row per field — edit the Value column freely, add/remove nothing else. `Main Photo Filename` should just be the filename you'll put inside `photos/` (e.g. `main.jpg`).

### Events tab
```
Event Name	Event Type	Subtitle	Tags	Photos Folder	Photos	Cover Photo	Video Link	Reel Links	Description
Tamil Video Song	Acting	Lead Actress · Tamil	Acting, Tamil	tamil-video-song				Female lead for the video song. | Portrayed happiness & sadness simultaneously — a girl yearning for her lover. | Strong emotional expression: love, longing & inner conflict.
Kannada Rap Song	Dance	Dance · ft. Ragini Dwivedi	Dance, Kannada	kannada-rap-song				Featured performing dance in the music video. | High-energy performance & strong screen presence.
The Weaving Couture	Modelling	Saree Modelling	Photoshoot, Ethnic Wear	weaving-couture				Modelled sarees for The Weaving Couture's collection shoot. | Styled across traditional drapes and prints for brand photography.
VEA — Gold & Diamonds	Modelling	Jewellery Modelling	Photoshoot, Jewellery	vea-jewellery-modelling				Modelled gold and diamond jewellery pieces for VEA's product photography. | Styled shots highlighting collection detail and craft.
VEA — Gold & Diamond Jewellery	Presenting	Jewellery	Reel/Video, English	vea-jewellery-presenting				Prepared jewellery content for reel videos with jewellery explanations. | Presented brand messages, collection stories & campaign lines. | Emphasised offers & unique collections for marketing, all on camera in Kannada & English.
ICL Government Services	Presenting	Government · Dubai	Reel/Video, English	icl-government-dubai				Video content presentation for the company situated at Madina Mall, Dubai. | Clear, engaging on-screen communication for a public audience.
Lifestone Natural Stone Murals	Presenting	Natural Stone · Murals	Reel/Video, English, Hindi, Kannada	lifestone-murals				Presented premium natural stone mural collection details on camera. | Explained design features, craftsmanship & installation benefits. | Delivered on-camera promotional content in English, Kannada & Hindi.
Homn Living Studio	Presenting	Interior Design	Reel/Video, Promotional	homn-living-studio				Delivered prepared scripts for brand presentations & interior showcases. | Narrated design concepts with clarity & confidence on camera. | Engaged social audience on styling, renovation & décor.
Kaveri Water Tanks	Presenting	Home & Utility	Reel/Video, Promotional	kaveri-water-tanks				On-camera product features & benefits, short-form video in Kannada and English. | Promotional reels driving brand visibility.
Vaibhav Furnitures	Presenting	Furniture · Salon	Reel/Video, Kannada	vaibhav-furnitures				Translated English scripts to natural, fluent Kannada and presented it on-camera. | Presented salon chairs, trolleys, shampoo stations.
Kannada Rap Song — Launch	Hosting	Promo & Hosting	Reel/Video, Live Event	kannada-rap-launch				Created promotional reels for the song launch. | Hosted the launch event featuring Ragini Dwivedi.
ICL FinCorp Launch	Hosting	Fintech · Patna	Live Event, Hindi	icl-fincorp-launch				On-camera presenter, Hindi promotional & informational content. | Launch event attended by Union Minister Jitan Ram Manjhi.
```

Column notes:
- **Event Type**: one of `Acting`, `Dance`, `Modelling`, `Presenting`, `Hosting`, `Podcast`
- **Photos Folder**: the folder name under `photos/events/` for this event, e.g. `tamil-video-song` → `photos/events/tamil-video-song/`. Just upload whatever image files belong to this event into that folder on GitHub — the site lists them automatically, no filenames to type anywhere.
- **Photos**: unused now — leave it blank. (Photos are read straight from the folder above.)
- **Cover Photo**: optional — one filename from that folder to use as the thumbnail, e.g. `photo123.jpg`. Leave blank to auto-use the first photo found in the folder (alphabetically).
- **Reel Links**: one or more Instagram Reel URLs, separated by `;`
- **Reel Covers**: optional — a filename from the Photos Folder to use as each reel's thumbnail, in the same order as Reel Links, separated by `;` (e.g. `reel1-cover.jpg;reel2-cover.jpg`). Leave an entry blank to fall back to the event's Cover Photo for that reel. This column doesn't exist in the sheet yet — add it yourself if you want per-reel covers.
- **Description**: use ` | ` between sentences to show them as separate bullet points

Want a real Excel dropdown for Event Type? Select the column → **Data → Data validation → Dropdown** with those 6 values — Google Sheets dropdowns persist normally, no caveats.

## Step 3 — Publish each one as CSV

Do this once per sheet (repeat for Profile and Events, whether they're tabs in one spreadsheet or 2 separate spreadsheets):

1. Open that spreadsheet → **File → Share → Publish to web**
2. In the dialog: first dropdown → pick the specific tab (not "Entire Document") if there's more than one tab, second dropdown → **Comma-separated values (.csv)** → **Publish** → confirm.
3. Copy the link it gives you. It looks like:
   `https://docs.google.com/spreadsheets/d/e/2PACX-1vT.......xyz/pub?gid=0&single=true&output=csv`
4. From that link, note the long ID between `/d/e/` and `/pub` (that's the `publishedId`) and the `gid=` number.

**If Profile/Events are 2 tabs in one spreadsheet**, the `publishedId` will come out the same for both links — only `gid` differs. **If they're 2 separate spreadsheets**, both `publishedId` and `gid` will differ. Either way, just paste whatever each link actually gives you — the config below has a separate slot for each.

## Step 4 — Fill in the config

Open `js/sheets-config.js` and paste in your values:
```js
window.SHEETS_CONFIG = {
  profile: { publishedId: "2PACX-1vT.......xyz", gid: "0" },
  events: { publishedId: "2PACX-1vT.......abc", gid: "0" },
  githubRepo: "your-username/your-repo-name"
};
```
`githubRepo` is only used for the Gallery section — it tells the site which GitHub repo to read `photos/gallery/` from. Set it once to match your actual repo (from its GitHub URL) and you won't need to touch it again.

## Step 5 — Push and go live

```
git add .
git commit -m "Connect Google Sheets"
git push
```
That's the last time you'll need git for a text/data change. From now on: edit the sheet → wait about a minute → refresh the live site.

## Notes

- **Sharing**: "Publish to web" makes that data publicly readable by anyone with the link — don't put anything in the sheet you don't want visible to site visitors.
- **Delay**: Google caches published sheets for roughly a minute, so edits aren't instant.
- **Local preview**: fetching from Google won't work if you just double-click `index.html` — run `npx serve .` and open the printed `localhost` URL instead.
- **If the site shows "Couldn't load site content"**: the error message on screen tells you what's wrong — almost always a tab that wasn't published, or a typo'd `publishedId`/`gid` in `js/sheets-config.js`.
