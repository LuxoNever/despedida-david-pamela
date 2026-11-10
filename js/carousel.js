(() => {
  "use strict";
  const app = window.Invitation;
  const carousel = document.getElementById("memory-carousel");
  const viewport = carousel?.querySelector(".carousel-viewport");
  const track = document.getElementById("carousel-track");
  if (!app || !carousel || !viewport || !track) return;

  const slides = [...track.children].filter((slide) => slide.classList.contains("carousel-slide"));
  const count = slides.length;
  if (count < 2) return;
  const previous = document.getElementById("carousel-prev");
  const next = document.getElementById("carousel-next");
  const toggle = document.getElementById("carousel-toggle");
  const dots = [...document.querySelectorAll("#carousel-dots [data-slide]")];
  const status = document.getElementById("carousel-status");
  const root = document.documentElement;
  const body = document.body;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const seconds = Number(app.config.carousel?.secondsPerSlide);
  const millisecondsPerSlide = (Number.isFinite(seconds) ? Math.max(3, Math.min(20, seconds)) : 5) * 1000;
  const canAnimate = typeof track.animate === "function";
  let step = 0;
  let phase = 0;
  let animation = null;
  let animationMode = "idle";
  let indexTimer = null;
  let resizeFrame = null;
  let userPaused = app.config.carousel?.autoplay === false;
  let hoverPaused = false;
  let focusPaused = false;
  let inView = !("IntersectionObserver" in window);
  let touchStart = null;

  const normalize = (value) => ((value % count) + count) % count;
  const reduceRequested = () => reduced.matches || app.config.motion?.reducedMotion === true || root.classList.contains("reduce-motion");
  const motionStopped = () => reduceRequested() || root.classList.contains("motion-paused");

  carousel.setAttribute("aria-roledescription", "carrusel");
  track.setAttribute("aria-live", "off");
  slides.forEach((slide, index) => {
    slide.setAttribute("role", "group");
    slide.setAttribute("aria-roledescription", "diapositiva");
    slide.setAttribute("aria-label", `${index + 1} de ${count}`);
  });

  // A complete copy on either side makes both directions and the loop boundary identical.
  function cloneSet() {
    return slides.map((slide) => {
      const clone = slide.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      clone.setAttribute("inert", "");
      clone.removeAttribute("id");
      clone.querySelectorAll("[id]").forEach((element) => element.removeAttribute("id"));
      clone.querySelectorAll("img").forEach((image) => { image.alt = ""; image.loading = "eager"; image.removeAttribute("fetchpriority"); });
      clone.dataset.carouselClone = "true";
      return clone;
    });
  }
  track.prepend(...cloneSet());
  track.append(...cloneSet());

  function transformFor(value) {
    return `translate3d(${-(count + value) * step}px, 0, 0)`;
  }

  function currentPhase() {
    if (!animation || !step || animationMode === "held") return phase;
    const transform = window.getComputedStyle(track).transform;
    if (transform === "none") return phase;
    let offset;
    try {
      if (typeof DOMMatrixReadOnly === "function") offset = new DOMMatrixReadOnly(transform).m41;
      else {
        const values = transform.slice(transform.indexOf("(") + 1, -1).split(",").map(Number);
        offset = values[transform.startsWith("matrix3d") ? 12 : 4];
      }
    } catch { return phase; }
    return Number.isFinite(offset) ? -offset / step - count : phase;
  }

  function clearIndexTimer() {
    window.clearTimeout(indexTimer);
    indexTimer = null;
  }

  function stop() {
    phase = currentPhase();
    clearIndexTimer();
    animation?.cancel();
    animation = null;
    animationMode = "idle";
  }

  // A paused Web Animation holds the position without creating an inline style attribute.
  function hold(value) {
    phase = normalize(value);
    if (!canAnimate) {
      viewport.scrollLeft = (count + phase) * step;
      return;
    }
    const transform = transformFor(phase);
    animation = track.animate([{ transform }, { transform }], { duration: 1, fill: "both" });
    animation.pause();
    animation.currentTime = 0;
    animationMode = "held";
  }

  function updateDots(index, announce = false) {
    const current = normalize(index);
    carousel.dataset.position = String(current);
    dots.forEach((dot) => {
      const position = Number(dot.dataset.slide);
      dot.setAttribute("aria-current", String(position === current));
      if (!dot.hasAttribute("aria-label")) dot.setAttribute("aria-label", `Ver recuerdo ${position + 1} de ${count}`);
    });
    if (announce && status) status.textContent = `Recuerdo ${current + 1} de ${count}.`;
  }

  function updateToggle() {
    if (!toggle) return;
    toggle.hidden = reduceRequested() || !canAnimate;
    toggle.setAttribute("aria-pressed", String(userPaused));
    const label = userPaused ? "Reanudar carrusel" : "Pausar carrusel";
    toggle.setAttribute("aria-label", label);
    const visibleLabel = toggle.querySelector("[data-carousel-label]");
    if (visibleLabel) visibleLabel.textContent = label;
  }

  function rotationAllowed() {
    const cover = document.getElementById("opening");
    return canAnimate && !userPaused && !hoverPaused && !focusPaused && !motionStopped()
      && !document.hidden && inView && body.classList.contains("experience-ready")
      && (!cover || cover.hidden) && !document.querySelector("#qr-dialog[open]");
  }

  // Only one position timer runs, once per photograph. The browser animates every frame itself.
  function scheduleIndex() {
    clearIndexTimer();
    if (animationMode !== "auto") return;
    const value = currentPhase();
    updateDots(Math.floor(normalize(value) + .00001));
    const remaining = Math.floor(value + .00001) + 1 - value;
    indexTimer = window.setTimeout(scheduleIndex, Math.max(50, remaining * millisecondsPerSlide + 20));
  }

  function startRotation() {
    stop();
    phase = normalize(phase);
    // The browser owns the complete repeating timeline; matching image sets hide its boundary.
    // Resuming seeks inside that full period instead of chaining a tiny remainder animation.
    const active = track.animate([
      { transform: transformFor(0) },
      { transform: transformFor(count) },
    ], { duration: count * millisecondsPerSlide, iterations: Infinity, easing: "linear", fill: "both" });
    active.currentTime = phase * millisecondsPerSlide;
    animation = active;
    animationMode = "auto";
    scheduleIndex();
  }

  function syncState() {
    updateToggle();
    if (!step) return;
    if (animationMode === "manual") {
      if (!motionStopped() && !document.hidden) return;
      stop();
      hold(Math.round(phase));
      updateDots(Math.round(phase));
    }
    if (rotationAllowed()) {
      if (animationMode !== "auto") startRotation();
    } else if (animationMode === "auto") {
      stop();
      hold(phase);
      updateDots(Math.floor(normalize(phase) + .00001));
    }
  }

  function goTo(target) {
    if (!step) return;
    stop();
    const begin = normalize(phase);
    // Keep manual travel inside the extra sets, including next/previous across the ends.
    const end = target(begin);
    userPaused = true;
    updateToggle();
    const index = normalize(Math.round(end));
    updateDots(index);
    if (!canAnimate || motionStopped()) {
      hold(index);
      updateDots(index, true);
      return;
    }
    const active = track.animate([
      { transform: transformFor(begin) },
      { transform: transformFor(end) },
    ], { duration: Math.min(850, 360 + Math.abs(end - begin) * 120), easing: "cubic-bezier(.2,.8,.2,1)", fill: "both" });
    animation = active;
    animationMode = "manual";
    active.onfinish = () => {
      if (animation !== active) return;
      active.cancel();
      animation = null;
      animationMode = "idle";
      hold(index);
      updateDots(index, true);
      syncState();
    };
  }

  function move(direction) {
    goTo((begin) => Math.floor(begin) + direction);
  }

  function nearestTarget(target, begin) {
    let distance = target - begin;
    if (distance > count / 2) distance -= count;
    if (distance < -count / 2) distance += count;
    // A multi-slide forward shortcut would run past the single appended image set.
    return begin + distance > count ? target : begin + distance;
  }

  previous?.addEventListener("click", () => move(-1));
  next?.addEventListener("click", () => move(1));
  dots.forEach((dot) => dot.addEventListener("click", () => {
    const target = Number(dot.dataset.slide);
    if (!Number.isInteger(target) || target < 0 || target >= count) return;
    goTo((begin) => nearestTarget(target, begin));
  }));
  toggle?.addEventListener("click", () => {
    userPaused = !userPaused;
    if (!userPaused) { hoverPaused = false; focusPaused = false; }
    syncState();
  });
  // Hover pauses the photographs, not the surrounding headline and invitation copy.
  viewport.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "touch") return;
    hoverPaused = true;
    syncState();
  });
  viewport.addEventListener("pointerleave", () => { hoverPaused = false; syncState(); });
  function isInteractiveFocus(target) {
    if (!target?.matches || !carousel.contains(target)) return false;
    const control = target.matches("button:not(:disabled), a[href], input:not(:disabled):not([type='hidden']), select:not(:disabled), textarea:not(:disabled), [contenteditable='true']");
    return control || (target.hasAttribute("tabindex") && target.tabIndex >= 0);
  }
  carousel.addEventListener("focusin", (event) => {
    // beginHero focuses a tabindex=-1 heading; it must not disable automatic rotation.
    if (!isInteractiveFocus(event.target)) {
      focusPaused = false;
      syncState();
      return;
    }
    if (isInteractiveFocus(event.relatedTarget)) return;
    focusPaused = true;
    syncState();
  });
  carousel.addEventListener("focusout", (event) => {
    if (isInteractiveFocus(event.relatedTarget)) return;
    focusPaused = false;
    syncState();
  });
  viewport.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    if (event.target.closest("input, select, textarea")) return;
    event.preventDefault();
    if (event.key === "ArrowLeft") move(-1);
    if (event.key === "ArrowRight") move(1);
    if (event.key === "Home") goTo((begin) => nearestTarget(0, begin));
    if (event.key === "End") goTo((begin) => nearestTarget(count - 1, begin));
  });
  viewport.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "touch" || event.target.closest("button, a")) return;
    touchStart = { x: event.clientX, y: event.clientY };
    userPaused = true;
    syncState();
  }, { passive: true });
  viewport.addEventListener("pointerup", (event) => {
    if (!touchStart) return;
    const dx = event.clientX - touchStart.x;
    const dy = event.clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) move(dx < 0 ? 1 : -1);
  }, { passive: true });
  viewport.addEventListener("pointercancel", () => { touchStart = null; });

  function measure() {
    resizeFrame = null;
    const value = currentPhase();
    stop();
    const slideStyle = window.getComputedStyle(slides[0]);
    let width = parseFloat(slideStyle.width) || slides[0].offsetWidth;
    if (slideStyle.boxSizing !== "border-box") {
      width += ["paddingLeft", "paddingRight", "borderLeftWidth", "borderRightWidth"]
        .reduce((total, property) => total + (parseFloat(slideStyle[property]) || 0), 0);
    }
    const gap = parseFloat(window.getComputedStyle(track).columnGap) || 0;
    if (!width) return;
    step = width + gap;
    hold(value);
    updateDots(Math.floor(normalize(value) + .00001));
    syncState();
  }
  function requestMeasure() {
    if (resizeFrame !== null) return;
    resizeFrame = window.requestAnimationFrame(measure);
  }
  if ("ResizeObserver" in window) new ResizeObserver(requestMeasure).observe(viewport);
  else window.addEventListener("resize", requestMeasure);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      inView = entries[0].isIntersecting;
      syncState();
    }, { threshold: .05 }).observe(carousel);
  }
  const stateObserver = new MutationObserver(syncState);
  [root, body, document.getElementById("opening"), document.getElementById("qr-dialog")].filter(Boolean)
    .forEach((element) => stateObserver.observe(element, { attributes: true, attributeFilter: ["class", "hidden", "open"] }));
  reduced.addEventListener("change", syncState);
  document.addEventListener("visibilitychange", syncState);
  window.addEventListener("pageshow", syncState);
  app.carousel = {
    pause() { userPaused = true; syncState(); },
    resume() { userPaused = false; hoverPaused = focusPaused = false; syncState(); },
    get index() { return normalize(Math.floor(currentPhase() + .00001)); },
  };
  measure();
})();
