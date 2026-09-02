(async () => {
  const CONTENT = window.SITE_CONTENT;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const loadingScreen = $("loadingScreen");
  const errorScreen = $("errorScreen");
  $("errorRetry").addEventListener("click", () => window.location.reload());

  let SITE;
  try {
    SITE = await window.loadSiteData();
  } catch (err) {
    console.error(err);
    loadingScreen.hidden = true;
    $("errorMessage").textContent = err.message || "Something went wrong loading the data.";
    errorScreen.hidden = false;
    return;
  }
  loadingScreen.hidden = true;

  const PROFILE = SITE.profile || {};
  const EVENTS = SITE.events || [];
  const GALLERY = SITE.gallery || [];

  /* ---------- meta ---------- */
  document.title = PROFILE.name ? `${PROFILE.name} — ${PROFILE.role || "Portfolio"}` : "Portfolio";
  $("navBrand").textContent = PROFILE.name || "Your Name";
  const favicon = document.createElement("link");
  favicon.rel = "icon";
  favicon.href =
    "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>" +
    (CONTENT.meta.faviconEmoji || "✨") + "</text></svg>";
  document.head.appendChild(favicon);

  /* ---------- hero (index.html only) — just name + tagline ---------- */
  if ($("heroName")) {
    $("heroName").textContent = PROFILE.name || "Your Name";
    $("heroKicker").textContent = PROFILE.hero?.kicker || "";
  }

  /* ---------- full-screen photo (index.html only) ---------- */
  if ($("photoHeroImg") && PROFILE.mainPhoto) {
    $("photoHeroImg").src = PROFILE.mainPhoto;
  }

  /* quick-nav: jump to a Portfolio category. From index.html (hero) this is a
     cross-page link to portfolio.html; from portfolio.html itself it switches
     which single group is shown — the others stay hidden, no bleed-through. */
  const QUICKNAV_LINKS = [
    { label: "Acting", group: "adm" },
    { label: "Content Presenter", group: "presenter" },
    { label: "Host", group: "hosting" }
  ];
  function renderQuickNav(container, { samePage }) {
    if (!container) return;
    const hint = document.createElement("p");
    hint.className = "quicknav__hint" + (samePage ? " quicknav__hint--left" : "");
    hint.textContent = "Click a category below to view its work";
    container.insertAdjacentElement("beforebegin", hint);
    QUICKNAV_LINKS.forEach((link) => {
      const a = document.createElement("a");
      a.href = (samePage ? "" : "portfolio.html") + `#group-${link.group}`;
      a.textContent = link.label;
      a.dataset.group = link.group;
      if (samePage) {
        a.addEventListener("click", (e) => {
          e.preventDefault();
          setActiveGroup(link.group, { scroll: true });
        });
      }
      container.appendChild(a);
    });
  }
  renderQuickNav($("portfolioNav"), { samePage: true });
  renderQuickNav($("portfolioPreviewNav"), { samePage: false });

  /* ---------- about (index.html only) ---------- */
  if ($("aboutHeading")) {
  $("aboutKicker").textContent = CONTENT.about.kicker;
  $("aboutHeading").textContent = CONTENT.about.heading;
  // not sheet-driven — just a fixed file at photos/aboutme.jpg; falls back to
  // its placeholder state until that's added.
  const aboutPhoto = $("aboutPhoto");
  aboutPhoto.addEventListener("load", () => $("aboutFrame").classList.remove("is-empty"));
  aboutPhoto.src = "photos/aboutme.jpg";
  const aboutText = $("aboutParagraphs");
  (PROFILE.about?.paragraphs || []).forEach((p) => {
    const el = document.createElement("p");
    el.textContent = p;
    aboutText.appendChild(el);
  });
  }

  /* ---------- portfolio preview (index.html only) ---------- */
  if ($("portfolioPreviewHeading")) {
    $("portfolioPreviewKicker").textContent = CONTENT.portfolioPreview.kicker;
    $("portfolioPreviewHeading").textContent = CONTENT.portfolioPreview.heading;
    $("portfolioPreviewDesc").textContent = CONTENT.portfolioPreview.description;
  }

  /* ---------- portfolio groups (built from the Events sheet tab, portfolio.html only) ---------- */
  const GROUP_ORDER = ["adm", "presenter", "hosting"];
  const cardsWrap = $("disciplineCards");

  function renderPortfolioGroups() {
    GROUP_ORDER.forEach((groupId) => {
      const meta = CONTENT.groups[groupId];
      if (!meta) return;
      const projects = EVENTS.filter((e) => e.group === groupId);

      const groupEl = document.createElement("div");
      groupEl.className = "group";
      groupEl.id = `group-${groupId}`;
      groupEl.innerHTML = `
        <div class="group__head reveal">
          <span class="card__icon">${meta.icon}</span>
          <div>
            <h3 class="group__title">${esc(meta.title)}</h3>
            <p class="group__intro">${esc(meta.intro)}</p>
          </div>
        </div>
        <div class="project-cards"></div>`;

      const projectsWrap = groupEl.querySelector(".project-cards");
      if (projects.length === 0) {
        projectsWrap.innerHTML = `<p class="group__empty">No projects added yet — add a row to the Events sheet tab with Event Type "${meta.title.split(" ")[0]}".</p>`;
      }
      projects.forEach((p, i) => {
        const mediaCount = p.photos.length + p.reels.length;
        const card = document.createElement("article");
        card.className = "card reveal";
        card.style.transitionDelay = `${(i % 4) * 0.1}s`;
        card.innerHTML = `
          <div class="card__cover ${p.coverSrc ? "" : "is-empty"}">
            ${p.coverSrc ? `<img src="${p.coverSrc}" alt="${esc(p.name)}" loading="lazy">` : `<span>No cover photo yet</span>`}
          </div>
          <div class="card__body">
            <p class="card__tagline">${esc(p.subtitle)}</p>
            <h4 class="card__title">${esc(p.name)}</h4>
            <ul class="card__list">${p.bullets.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>
            <div class="tag-pills">${p.tags.map((t) => `<span class="tag-pill">${esc(t)}</span>`).join("")}</div>
            <div class="card__actions">
              <button class="card__link" data-show-more="true">
                Show More${mediaCount > 0 ? ` (${mediaCount})` : ""}
                <svg width="14" height="14"><use href="#icon-arrow"/></svg>
              </button>
              ${p.videoId ? `<button class="card__link" data-video-id="${esc(p.videoId)}">
                Watch Video
                <svg width="12" height="12"><use href="#icon-play"/></svg>
              </button>` : ""}
            </div>
          </div>`;

        const openMedia = () => openMediaModal(p);
        card.querySelector(".card__cover").addEventListener("click", openMedia);
        const showMoreBtn = card.querySelector("[data-show-more]");
        if (showMoreBtn) showMoreBtn.addEventListener("click", openMedia);

        projectsWrap.appendChild(card);
      });

      cardsWrap.appendChild(groupEl);
    });
  }
  function setActiveGroup(groupId, { scroll } = {}) {
    GROUP_ORDER.forEach((id) => {
      const el = $(`group-${id}`);
      if (el) el.classList.toggle("is-active", id === groupId);
    });
    document.querySelectorAll("#portfolioNav a").forEach((a) => {
      a.classList.toggle("is-active", a.dataset.group === groupId);
    });
    if (history.replaceState) history.replaceState(null, "", `#group-${groupId}`);
    if (scroll) {
      const nav = $("nav");
      window.scrollTo({ top: (cardsWrap.getBoundingClientRect().top + window.scrollY) - (nav ? nav.offsetHeight + 24 : 0), behavior: "smooth" });
    }
  }

  if (cardsWrap) {
    renderPortfolioGroups();
    const hashGroup = window.location.hash.replace("#group-", "");
    setActiveGroup(GROUP_ORDER.includes(hashGroup) ? hashGroup : GROUP_ORDER[0]);
  }

  /* ---------- gallery: combined dump — newest gallery uploads first, then tagged event photos (index.html only) ---------- */
  if ($("galleryGrid")) {
  $("galleryKicker").textContent = CONTENT.gallery.kicker;
  $("galleryHeading").textContent = CONTENT.gallery.heading;
  $("galleryDesc").textContent = CONTENT.gallery.description;

  const galleryGrid = $("galleryGrid");
  const galleryEmpty = $("galleryEmpty");
  const combinedFeed = [
    ...GALLERY.map((g) => ({ src: g.src, tag: null })),
    ...EVENTS.flatMap((ev) => ev.photos.map((src) => ({ src, tag: ev.name })))
  ];
  const galleryPhotoSet = combinedFeed.map((g, i) => ({ src: g.src, caption: `${g.tag || "Gallery"} — ${i + 1} / ${combinedFeed.length}` }));

  galleryEmpty.hidden = combinedFeed.length > 0;
  galleryEmpty.textContent = "No photos yet — drop images into photos/gallery/, or add photos to an event, and re-run the build script.";
  combinedFeed.forEach((g, i) => {
    const item = document.createElement("div");
    item.className = "gallery__item reveal";
    item.style.transitionDelay = `${(i % 6) * 0.08}s`;
    item.innerHTML = `<img src="${g.src}" alt="${esc(g.tag || "Gallery photo")}" loading="lazy">${g.tag ? `<span class="gallery__cat">${esc(g.tag)}</span>` : ""}`;
    item.addEventListener("click", () => openLightbox(galleryPhotoSet, i));
    galleryGrid.appendChild(item);
  });
  }

  /* Watch Video buttons on portfolio cards */
  document.addEventListener("click", (e) => {
    const videoBtn = e.target.closest("[data-video-id]");
    if (videoBtn) openVideoModal(videoBtn.dataset.videoId);
  });

  /* ---------- lightbox ---------- */
  const lightbox = $("lightbox");
  const lightboxImg = $("lightboxImg");
  const lightboxCaption = $("lightboxCaption");
  let currentPhotoSet = [];
  let lightboxIndex = 0;

  function openLightbox(photoSet, index) {
    currentPhotoSet = photoSet;
    lightboxIndex = index;
    updateLightbox();
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeLightbox() {
    lightbox.hidden = true;
    document.body.style.overflow = "";
  }
  function updateLightbox() {
    const p = currentPhotoSet[lightboxIndex];
    if (!p) return;
    lightboxImg.src = p.src;
    lightboxImg.alt = p.caption;
    lightboxCaption.textContent = p.caption;
  }
  function nextImage() { lightboxIndex = (lightboxIndex + 1) % currentPhotoSet.length; updateLightbox(); }
  function prevImage() { lightboxIndex = (lightboxIndex - 1 + currentPhotoSet.length) % currentPhotoSet.length; updateLightbox(); }

  $("lightboxClose").addEventListener("click", closeLightbox);
  $("lightboxNext").addEventListener("click", nextImage);
  $("lightboxPrev").addEventListener("click", prevImage);
  lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener("keydown", (e) => {
    if (!lightbox.hidden) {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
    }
    if (!videoModal.hidden && e.key === "Escape") closeVideoModal();
    if (!mediaModal.hidden && e.key === "Escape") closeMediaModal();
    if (!reelModal.hidden && e.key === "Escape") closeReelModal();
  });

  /* ---------- video modal ---------- */
  const videoModal = $("videoModal");
  const videoModalFrame = $("videoModalFrame");

  function openVideoModal(videoId) {
    videoModalFrame.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
    videoModal.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeVideoModal() {
    videoModal.hidden = true;
    videoModalFrame.src = "";
    document.body.style.overflow = "";
  }
  $("videoModalClose").addEventListener("click", closeVideoModal);
  videoModal.addEventListener("click", (e) => { if (e.target === videoModal) closeVideoModal(); });

  /* ---------- reel modal (Instagram embed) ---------- */
  const reelModal = $("reelModal");
  const reelModalContent = $("reelModalContent");
  let instagramScriptLoaded = false;

  function loadInstagramEmbedScript(callback) {
    if (instagramScriptLoaded) { callback(); return; }
    const script = document.createElement("script");
    script.src = "https://www.instagram.com/embed.js";
    script.async = true;
    script.onload = () => { instagramScriptLoaded = true; callback(); };
    document.body.appendChild(script);
  }
  function openReelModal(url) {
    reelModalContent.innerHTML = `<blockquote class="instagram-media" data-instgrm-permalink="${esc(url)}" data-instgrm-version="14" style="margin:0;width:100%;"></blockquote>`;
    reelModal.hidden = false;
    document.body.style.overflow = "hidden";
    loadInstagramEmbedScript(() => { if (window.instgrm) window.instgrm.Embeds.process(); });
  }
  function closeReelModal() {
    reelModal.hidden = true;
    reelModalContent.innerHTML = "";
    document.body.style.overflow = "";
  }
  $("reelModalClose").addEventListener("click", closeReelModal);
  reelModal.addEventListener("click", (e) => { if (e.target === reelModal) closeReelModal(); });

  /* ---------- media modal (Show More: full-screen, sectioned Photos -> Reels -> Video for one project) ---------- */
  const mediaModal = $("mediaModal");
  const mediaModalTitle = $("mediaModalTitle");
  const mediaModalBody = $("mediaModalBody");

  function buildMediaSection(label, tiles) {
    if (tiles.length === 0) return null;
    const section = document.createElement("div");
    section.className = "media-modal__section";
    const heading = document.createElement("h4");
    heading.className = "media-modal__section-title";
    heading.textContent = label;
    const grid = document.createElement("div");
    grid.className = "media-modal__grid";
    tiles.forEach((tile) => grid.appendChild(tile));
    section.append(heading, grid);
    return section;
  }

  function openMediaModal(project) {
    mediaModalTitle.textContent = project.name;
    mediaModalBody.innerHTML = "";

    const photoSet = project.photos.map((src, i) => ({ src, caption: `${project.name} — ${i + 1} / ${project.photos.length}` }));

    const photoTiles = project.photos.map((src, i) => {
      const tile = document.createElement("div");
      tile.className = "media-tile";
      tile.innerHTML = `<img src="${src}" alt="${esc(project.name)}" loading="lazy">`;
      tile.addEventListener("click", () => { closeMediaModal(); openLightbox(photoSet, i); });
      return tile;
    });

    const reelTiles = project.reels.map((url, i) => {
      const tile = document.createElement("div");
      tile.className = "media-tile media-tile--reel";
      tile.innerHTML = `<span class="media-tile__icon"><svg width="22" height="22"><use href="#icon-instagram"/></svg>Reel ${i + 1}</span>`;
      tile.addEventListener("click", () => { closeMediaModal(); openReelModal(url); });
      return tile;
    });

    const videoTiles = (project.videoIds || []).map((videoId, i) => {
      const tile = document.createElement("div");
      tile.className = "media-tile media-tile--video";
      const label = project.videoIds.length > 1 ? `Video ${i + 1}` : "Video";
      tile.innerHTML = `
        <iframe class="media-tile__preview" src="https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&rel=0&playsinline=1" allow="autoplay; encrypted-media" tabindex="-1"></iframe>
        <span class="media-tile__icon"><svg width="26" height="26"><use href="#icon-play"/></svg>${label}</span>`;
      tile.addEventListener("click", () => { closeMediaModal(); openVideoModal(videoId); });
      return tile;
    });

    [
      buildMediaSection("Photos", photoTiles),
      buildMediaSection("Reels", reelTiles),
      buildMediaSection("Video", videoTiles)
    ].forEach((section) => { if (section) mediaModalBody.appendChild(section); });

    if (photoTiles.length === 0 && reelTiles.length === 0 && videoTiles.length === 0) {
      mediaModalBody.innerHTML = `<p class="gallery__empty">No media added yet.</p>`;
    }

    mediaModal.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeMediaModal() {
    mediaModal.hidden = true;
    document.body.style.overflow = "";
  }
  $("mediaModalClose").addEventListener("click", closeMediaModal);
  mediaModal.addEventListener("click", (e) => { if (e.target === mediaModal) closeMediaModal(); });

  /* ---------- contact (index.html only) ---------- */
  if ($("contactHeading")) {
    $("contactKicker").textContent = CONTENT.contact.kicker;
    $("contactHeading").textContent = CONTENT.contact.heading;
    $("contactDesc").textContent = CONTENT.contact.description;
    const detailsHtml = [
      PROFILE.email ? `<a class="chip" href="mailto:${esc(PROFILE.email)}">${esc(PROFILE.email)}</a>` : "",
      PROFILE.phone ? `<a class="chip" href="tel:${esc(PROFILE.phone.replace(/\s+/g, ""))}">${esc(PROFILE.phone)}</a>` : "",
      PROFILE.location ? `<span class="chip chip--muted">${esc(PROFILE.location)}</span>` : ""
    ].join("");
    $("contactDetails").innerHTML = detailsHtml;

    const socialWrap = $("socialLinks");
    const whatsappNumber = PROFILE.phone ? PROFILE.phone.replace(/\D/g, "") : "";
    const socialLinks = [
      PROFILE.instagramUrl ? { name: "Instagram", url: PROFILE.instagramUrl, icon: "instagram" } : null,
      whatsappNumber ? { name: "WhatsApp", url: `https://wa.me/${whatsappNumber}`, icon: "whatsapp" } : null,
      PROFILE.email ? { name: "Email", url: `mailto:${PROFILE.email}`, icon: "email" } : null
    ].filter(Boolean);
    socialLinks.forEach((s) => {
      const a = document.createElement("a");
      a.href = s.url;
      if (s.icon !== "email") { a.target = "_blank"; a.rel = "noopener"; }
      a.setAttribute("aria-label", s.name);
      a.innerHTML = `<svg width="19" height="19"><use href="#icon-${s.icon}"/></svg>`;
      socialWrap.appendChild(a);
    });
  }

  $("footerText").textContent = `© ${new Date().getFullYear()} ${PROFILE.name || ""}. ${PROFILE.footerNote || CONTENT.footer.fallbackText}`;

  /* ---------- floating contact button (site-wide, all pages) ---------- */
  const fabLinks = [
    PROFILE.phone ? { name: "Call", url: `tel:${PROFILE.phone.replace(/\s+/g, "")}`, icon: "phone" } : null,
    PROFILE.instagramUrl ? { name: "Instagram", url: PROFILE.instagramUrl, icon: "instagram", external: true } : null,
    PROFILE.email ? { name: "Email", url: `mailto:${PROFILE.email}`, icon: "email" } : null
  ].filter(Boolean);

  if (fabLinks.length) {
    const fab = document.createElement("div");
    fab.className = "fab-contact";
    const itemsHtml = fabLinks.map((l) =>
      `<a href="${l.url}" aria-label="${esc(l.name)}"${l.external ? ' target="_blank" rel="noopener"' : ""}><svg width="19" height="19"><use href="#icon-${l.icon}"/></svg></a>`
    ).join("");
    fab.innerHTML = `
      <div class="fab-contact__items">${itemsHtml}</div>
      <button type="button" class="fab-contact__main" aria-label="Contact options" aria-expanded="false">
        <svg class="fab-contact__icon--phone" width="24" height="24"><use href="#icon-phone"/></svg>
        <svg class="fab-contact__icon--close" width="20" height="20"><use href="#icon-close"/></svg>
      </button>`;
    document.body.appendChild(fab);

    const fabMain = fab.querySelector(".fab-contact__main");
    fabMain.addEventListener("click", () => {
      const isOpen = fab.classList.toggle("is-open");
      fabMain.setAttribute("aria-expanded", String(isOpen));
    });
    document.addEventListener("click", (e) => {
      if (fab.classList.contains("is-open") && !fab.contains(e.target)) {
        fab.classList.remove("is-open");
        fabMain.setAttribute("aria-expanded", "false");
      }
    });

    // Hide the fixed button while the footer is on screen so it doesn't sit
    // over the back-to-top arrow / copyright line.
    const footerEl = document.querySelector(".footer");
    if (footerEl && "IntersectionObserver" in window) {
      new IntersectionObserver(
        ([entry]) => fab.classList.toggle("is-near-footer", entry.isIntersecting),
        { rootMargin: "0px 0px -10px 0px" }
      ).observe(footerEl);
    }
  }

  /* ---------- nav behaviour ---------- */
  const nav = $("nav");
  const navLinks = $("navLinks");
  const navToggle = $("navToggle");
  window.addEventListener("scroll", () => {
    nav.classList.toggle("is-scrolled", window.scrollY > 20);
  });
  navToggle.addEventListener("click", () => {
    const open = navLinks.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(open));
  });
  navLinks.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => navLinks.classList.remove("is-open"));
  });

  const sectionIds = ["about", "disciplines", "gallery", "contact"];
  const navLinkMap = new Map(
    Array.from(navLinks.querySelectorAll("a"))
      .filter((a) => a.getAttribute("href").startsWith("#"))
      .map((a) => [a.getAttribute("href").slice(1), a])
  );
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const link = navLinkMap.get(entry.target.id);
        if (!link) return;
        if (entry.isIntersecting) {
          navLinks.querySelectorAll("a").forEach((a) => a.classList.remove("is-active"));
          link.classList.add("is-active");
        }
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sectionIds.forEach((id) => {
    const el = document.getElementById(id);
    if (el) sectionObserver.observe(el);
  });

  /* ---------- back to top ---------- */
  $("toTop").addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  /* ---------- scroll reveal ---------- */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));
})();
