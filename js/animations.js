(() => {
  "use strict";
  const app = window.Invitation;
  if (!app) return;
  const root = document.documentElement;
  const body = document.body;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const cover = document.getElementById("opening");
  const invitation = document.getElementById("invitation");
  const openButton = document.getElementById("open-invitation");
  const openSeal = document.getElementById("open-seal");
  const letter = cover.querySelector(".cover-letter");
  const reopenButton = document.getElementById("reopen-invitation");
  const motionButton = document.getElementById("motion-toggle");
  let userPaused = false;
  let opening = false;
  let observer = null;
  let ambientObserver = null;
  let revealTimeout = null;
  let closeTimeout = null;
  let introTimeout = null;
  const reduceRequested = () => reduced.matches || app.config.motion?.reducedMotion === true;

  function revealAll() {
    observer?.disconnect();
    document.querySelectorAll(".reveal").forEach((element) => {
      element.classList.remove("reveal-pending");
      element.classList.add("is-visible");
    });
  }

  function setupReveals() {
    const items = [...document.querySelectorAll(".reveal")].filter((item) => !item.closest("[hidden]"));
    if (reduceRequested() || userPaused || !("IntersectionObserver" in window)) { revealAll(); return; }
    try {
      observer?.disconnect();
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      }, { threshold: .08, rootMargin: "0px 0px -24px 0px" });
      items.forEach((item) => {
        if (item.classList.contains("is-visible")) return;
        item.classList.add("reveal-pending");
        observer.observe(item);
      });
    } catch { revealAll(); }
  }

  function syncMotion() {
    root.classList.toggle("reduce-motion", reduceRequested());
    root.classList.toggle("motion-paused", userPaused);
    motionButton.hidden = reduceRequested();
    motionButton.setAttribute("aria-pressed", String(userPaused));
    motionButton.setAttribute("aria-label", userPaused ? "Reanudar animaciones" : "Pausar animaciones");
    if (app.features.ambientMotion === false) body.classList.add("no-ambient-motion");
    if (reduceRequested() || userPaused) {
      finishIntro();
      revealAll();
    }
    else setupReveals();
  }
  motionButton.addEventListener("click", () => { userPaused = !userPaused; syncMotion(); });
  reduced.addEventListener("change", syncMotion);
  document.addEventListener("visibilitychange", () => { body.classList.toggle("page-hidden", document.hidden); });

  function finishIntro() {
    window.clearTimeout(introTimeout);
    introTimeout = null;
    body.classList.add("hero-entered");
  }

  function clearOpeningTimers() {
    window.clearTimeout(revealTimeout);
    window.clearTimeout(closeTimeout);
    window.clearTimeout(introTimeout);
    revealTimeout = closeTimeout = introTimeout = null;
  }

  function beginHero() {
    revealTimeout = null;
    cover.dataset.state = "opened";
    cover.classList.add("is-revealing");
    cover.inert = true;
    cover.setAttribute("aria-hidden", "true");
    invitation.inert = false;
    body.classList.remove("opening-active");
    body.classList.add("experience-ready");
    window.scrollTo({ top: 0, behavior: "instant" });
    document.getElementById("hero-title").focus({ preventScroll: true });
    setupReveals();
    if (reduceRequested() || userPaused) finishIntro();
    else introTimeout = window.setTimeout(finishIntro, 1900);
  }

  function finishOpening() {
    cover.hidden = true;
    cover.removeAttribute("aria-busy");
    opening = false;
    closeTimeout = null;
  }

  function showCover() {
    clearOpeningTimers();
    opening = false;
    body.classList.remove("experience-ready", "hero-entered");
    cover.classList.remove("is-opening", "is-revealing", "is-simple-opening");
    cover.dataset.state = "closed";
    letter.setAttribute("aria-hidden", "true");
    cover.hidden = false;
    cover.inert = false;
    cover.removeAttribute("aria-hidden");
    cover.removeAttribute("aria-busy");
    invitation.inert = true;
    body.classList.add("opening-active");
    window.scrollTo({ top: 0, behavior: "instant" });
    openButton.focus({ preventScroll: true });
  }

  function openInvitation(skipMotion = false) {
    if (opening || cover.hidden) return;
    clearOpeningTimers();
    opening = true;
    cover.dataset.state = "opening";
    cover.classList.add("is-opening");
    letter.removeAttribute("aria-hidden");
    cover.setAttribute("aria-busy", "true");
    // Sello → solapa → tarjeta → pausa de lectura → hero (2,14 s).
    if (skipMotion) {
      cover.classList.add("is-simple-opening");
      beginHero();
      closeTimeout = window.setTimeout(finishOpening, 100);
    } else if (reduceRequested() || userPaused) {
      cover.classList.add("is-simple-opening");
      revealTimeout = window.setTimeout(beginHero, 500);
      closeTimeout = window.setTimeout(finishOpening, 600);
    } else {
      revealTimeout = window.setTimeout(beginHero, 1700);
      closeTimeout = window.setTimeout(finishOpening, 2140);
    }
  }

  cover.addEventListener("keydown", (event) => {
    if (event.key === "Escape") { event.preventDefault(); openInvitation(true); }
    if (event.key === "Tab") {
      const controls = [openSeal, openButton].filter((control) => control && !control.hidden);
      const current = controls.indexOf(document.activeElement);
      const next = (current + (event.shiftKey ? -1 : 1) + controls.length) % controls.length;
      event.preventDefault();
      controls[next].focus();
    }
  });
  openButton.addEventListener("click", () => openInvitation());
  openSeal?.addEventListener("click", () => openInvitation());
  reopenButton.addEventListener("click", () => {
    if (window.location.hash) window.history.replaceState(null, "", window.location.pathname + window.location.search);
    window.scrollTo({ top: 0, behavior: "instant" });
    showCover();
  });

  // Un único cálculo por frame; los eventos de scroll son pasivos.
  const progress = document.getElementById("reading-progress-bar");
  let framePending = false;
  function updateProgress() {
    const distance = root.scrollHeight - window.innerHeight;
    const amount = distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 0;
    progress.value = amount;
    framePending = false;
  }
  function requestProgress() {
    if (framePending) return;
    framePending = true;
    window.requestAnimationFrame(updateProgress);
  }
  window.addEventListener("scroll", requestProgress, { passive: true });
  window.addEventListener("resize", requestProgress);
  updateProgress();
  if ("IntersectionObserver" in window) {
    ambientObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle("is-in-view", entry.isIntersecting));
    });
    document.querySelectorAll(".ambient-motion").forEach((element) => ambientObserver.observe(element));
  }
  syncMotion();
  function hasSectionDeepLink() {
    let id;
    try { id = decodeURIComponent(window.location.hash.slice(1)); } catch { return false; }
    const target = id && document.getElementById(id);
    return Boolean(target && !target.closest("[hidden]") && target.closest("[data-section], .site-footer"));
  }

  // La raíz y #inicio siempre presentan el sobre. No se guarda ningún estado de apertura.
  if (app.features.opening !== false && !hasSectionDeepLink()) {
    showCover();
  } else {
    cover.hidden = true;
    cover.inert = true;
    cover.dataset.state = "opened";
    cover.setAttribute("aria-hidden", "true");
    invitation.inert = false;
    body.classList.remove("opening-active");
    body.classList.add("experience-ready", "hero-entered");
    setupReveals();
  }
  window.addEventListener("pageshow", (event) => {
    if (event.persisted && app.features.opening !== false && !hasSectionDeepLink()) showCover();
  });
  if (app.features.opening !== false) {
    reopenButton.hidden = false;
    document.getElementById("static-wordmark").hidden = true;
  }
})();
