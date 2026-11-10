(() => {
  "use strict";
  const app = window.Invitation;
  if (!app || app.features.countdown === false) return;
  const settings = app.config.countdown || {};
  const copy = app.copy.countdown || {};
  const timer = document.getElementById("countdown-timer");
  const note = document.getElementById("countdown-note");
  const description = document.getElementById("countdown-description");
  const digits = [...timer.querySelectorAll("[data-unit]")];
  let interval = null;
  let lastSummary = "";

  // Una hora sin desplazamiento horario explícito no tiene un instante inequívoco.
  function parseTarget(value) {
    const candidate = app.text(value);
    const pattern = /^(\d{4}-\d{2}-\d{2})T([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?(Z|[+-](?:0\d|1[0-4]):[0-5]\d)$/;
    const parts = candidate.match(pattern);
    if (!parts || !app.formatDate(parts[1])) return null;
    if (/^[+-]14:(?!00)/.test(parts[5])) return null;
    const timestamp = Date.parse(candidate);
    return Number.isFinite(timestamp) ? timestamp : null;
  }

  if (settings.showSeconds === false) {
    timer.querySelector("[data-seconds]").hidden = true;
    timer.classList.add("without-seconds");
  }
  const target = parseTarget(settings.targetDate);
  if (target === null) {
    timer.dataset.state = "pending";
    note.textContent = copy.pending || "Fecha por confirmar";
    description.textContent = copy.pendingDescription || "La fecha del encuentro está por confirmar.";
    return;
  }
  timer.dataset.state = "active";

  function stop() {
    if (interval !== null) window.clearInterval(interval);
    interval = null;
  }

  function update() {
    const remaining = Math.max(0, Math.ceil((target - Date.now()) / 1000));
    const values = {
      days: Math.floor(remaining / 86400),
      hours: Math.floor(remaining / 3600) % 24,
      minutes: Math.floor(remaining / 60) % 60,
      seconds: remaining % 60,
    };
    digits.forEach((digit) => {
      const value = String(values[digit.dataset.unit]).padStart(2, "0");
      if (digit.textContent === value) return;
      digit.textContent = value;
      const alternate = digit.classList.contains("digit-change-a");
      digit.classList.toggle("digit-change-a", !alternate);
      digit.classList.toggle("digit-change-b", alternate);
    });
    const summary = remaining > 0
      ? `Faltan ${values.days} días, ${values.hours} horas y ${values.minutes} minutos para el encuentro.`
      : copy.expired || "El momento de encontrarnos ha llegado.";
    // No se anuncia cada segundo; la descripción cambia solo con el minuto.
    if (summary !== lastSummary) { description.textContent = summary; lastSummary = summary; }
    note.textContent = remaining > 0 ? copy.active || "Cada vez falta menos." : copy.expired || "El momento ha llegado.";
    if (remaining === 0) { timer.dataset.state = "complete"; stop(); }
    return remaining;
  }

  function start() {
    stop();
    if (update() > 0 && !document.hidden) interval = window.setInterval(update, 1000);
  }
  document.addEventListener("visibilitychange", () => { document.hidden ? stop() : start(); });
  start();
})();
