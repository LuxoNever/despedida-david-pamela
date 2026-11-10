(() => {
  "use strict";
  const config = window.INVITATION_CONFIG || {};
  const copy = config.copy || {};
  const features = config.features || {};
  const placeholders = copy.placeholders || {};
  const text = (value) => typeof value === "string" ? value.trim() : "";
  const valueAt = (object, path) => path.split(".").reduce((value, key) => value?.[key], object);

  document.querySelectorAll("[data-copy]").forEach((element) => {
    const value = text(valueAt(copy, element.dataset.copy));
    if (value) element.textContent = value;
  });
  if (text(copy.pageTitle)) document.title = copy.pageTitle;
  if (text(copy.pageDescription)) document.querySelector('meta[name="description"]').content = copy.pageDescription;

  const first = text(config.couple?.firstName);
  const second = text(config.couple?.secondName);
  const missing = placeholders.individualName || "Nombre por confirmar";
  const names = first || second ? `${first || missing}${config.couple?.separator || " y "}${second || missing}` : placeholders.couple || "Nombres por confirmar";
  document.querySelectorAll("[data-couple]").forEach((element) => { element.textContent = names; });

  document.querySelectorAll("[data-payment-amount]").forEach((element) => {
    const price = Number(config.payment?.price);
    element.textContent = Number.isFinite(price) && price > 0 ? `${price} ${text(config.payment?.currency) || "Bs"}` : "Importe por confirmar";
  });

  function formatDate(value) {
    const candidate = text(value);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(candidate)) return null;
    const [year, month, day] = candidate.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
    return new Intl.DateTimeFormat("es", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(date);
  }
  const date = formatDate(config.event?.date);
  const time = text(config.event?.time);
  const eventValues = {
    date: date ? text(config.event?.dateLabel) || date : placeholders.date || "Fecha por confirmar",
    time: /^([01]\d|2[0-3]):[0-5]\d$/.test(time) ? text(config.event?.timeLabel) || `${time} h` : placeholders.time || "Hora por confirmar",
    venue: text(config.event?.venue?.name) || placeholders.venue || "Lugar por confirmar",
    address: text(config.event?.venue?.address) || placeholders.address || "Próximamente compartiremos la dirección.",
  };
  document.querySelectorAll("[data-event]").forEach((element) => { element.textContent = eventValues[element.dataset.event]; });
  if (date) document.querySelector('[data-copy="details.dateNote"]').textContent = copy.details?.dateConfirmedNote || "Un día para guardar en el recuerdo.";

  function mapsUrl(value) {
    try {
      const url = new URL(text(value));
      const host = url.hostname;
      const google = ["google.com", "www.google.com", "maps.google.com"].includes(host);
      const path = url.pathname === "/maps" || url.pathname.startsWith("/maps/");
      const short = host === "maps.app.goo.gl" || (host === "goo.gl" && url.pathname.startsWith("/maps/"));
      return url.protocol === "https:" && !url.username && !url.password && ((google && (path || host === "maps.google.com")) || short) ? url.href : null;
    } catch { return null; }
  }
  const map = mapsUrl(config.event?.venue?.mapsUrl);
  const mapLink = document.getElementById("maps-link");
  mapLink.hidden = !map;
  document.getElementById("maps-pending").hidden = Boolean(map);
  if (map) {
    mapLink.href = map;
  } else mapLink.removeAttribute("href");

  document.querySelectorAll("[data-image]").forEach((image) => {
    const settings = config.images?.[image.dataset.image];
    if (!text(settings?.src)) return;
    try {
      const url = new URL(settings.src, document.baseURI);
      if (!["https:", "http:", "file:"].includes(url.protocol)) return;
      const fallback = { src: image.getAttribute("src"), alt: image.alt };
      image.addEventListener("error", () => { image.src = fallback.src; image.alt = fallback.alt; }, { once: true });
      image.alt = typeof settings.alt === "string" ? settings.alt : "Fotografía compartida para la invitación.";
      image.src = url.href;
    } catch { /* Conserva la escena ambiental si la ruta no es válida. */ }
  });

  document.querySelectorAll("[data-section]").forEach((section) => { section.hidden = features[section.dataset.section] === false; });
  document.querySelectorAll("[data-nav]").forEach((link) => { link.hidden = features[link.dataset.nav] === false; });
  // Las anclas que continúan la lectura siempre apuntan a una sección visible.
  const firstVisible = [...document.querySelectorAll("[data-section]")].find((section) => !section.hidden);
  document.querySelectorAll('a[data-continue], a[href="#mensaje"]').forEach((link) => { link.href = firstVisible ? `#${firstVisible.id}` : "#closing-title"; });

  window.Invitation = { config, copy, features, text, formatDate };
})();
