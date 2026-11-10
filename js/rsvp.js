(() => {
  "use strict";
  const app = window.Invitation;
  if (!app || app.features.rsvp === false) return;
  const copy = app.copy.rsvp || {};
  const form = document.getElementById("rsvp-form");
  const nameInput = document.getElementById("guest-name");
  const choices = [...form.querySelectorAll('input[name="attendance"]')];
  const companionsField = document.getElementById("companions-field");
  const totalInput = document.getElementById("companions");
  const preview = document.getElementById("rsvp-preview");
  const messageOutput = document.getElementById("preview-message");
  const status = document.getElementById("rsvp-status");
  const sendLink = document.getElementById("send-rsvp");
  const copyButton = document.getElementById("copy-rsvp");
  const fallback = document.getElementById("copy-fallback");
  const copyArea = document.getElementById("copy-message");
  const instructions = document.getElementById("whatsapp-instructions");
  const maximum = Number.isInteger(app.config.rsvp?.maxCompanions) ? Math.max(0, Math.min(20, app.config.rsvp.maxCompanions)) : 4;
  const maxTotal = app.features.companions === false ? 1 : maximum + 1;
  const phone = app.text(app.config.contact?.whatsappNumber);
  const phoneValid = /^[1-9]\d{7,14}$/.test(phone);
  let attempted = false;
  let prepared = false;
  let currentMessage = "";

  const selectedAttendance = () => choices.find((choice) => choice.checked)?.value;
  const peopleLabel = (count) => count === 1 ? "persona" : "personas";
  const replaceTokens = (template, values) => template.replace(/\{(couple|name|count|peopleLabel|eventDetails)\}/g, (token, key) => values[key] ?? token);
  const announce = (message) => { if (status.textContent !== message) status.textContent = message; };

  for (let total = 1; total <= maxTotal; total += 1) {
    const option = document.createElement("option");
    option.value = String(total);
    option.textContent = `${total} ${peopleLabel(total)}${total === 1 ? " (solo yo)" : ""}`;
    totalInput.append(option);
  }
  document.getElementById("count-help").textContent = replaceTokens(copy.countHelp || "Incluye tu asistencia. Máximo: {count} {peopleLabel}.", { count: maxTotal, peopleLabel: peopleLabel(maxTotal) });
  document.getElementById("prepare-rsvp").disabled = false;

  function readForm() {
    const raw = nameInput.value;
    const name = app.text(raw).normalize("NFC").replace(/ +/g, " ");
    const parts = name.split(" ");
    const controls = /[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/;
    const validName = raw.length <= 80 && name.length >= 3 && name.length <= 80
      && !controls.test(raw) && /^[\p{L}\p{M}][\p{L}\p{M} .\u00b7'\u2019-]*$/u.test(name)
      && parts.length >= 2 && parts.every((part) => /\p{L}/u.test(part));
    const attendance = selectedAttendance();
    const validAttendance = attendance === "yes" || attendance === "no";
    const total = attendance === "yes" ? Number(totalInput.value) : null;
    const validTotal = attendance !== "yes" || (/^[1-9]\d?$/.test(totalInput.value) && Number.isInteger(total) && total >= 1 && total <= maxTotal);
    return { name, attendance, total, validName, validAttendance, validTotal, valid: validName && validAttendance && validTotal };
  }

  function showError(id, message) {
    const element = document.getElementById(id);
    element.textContent = message;
    element.hidden = !message;
  }

  function updateErrors(data, show) {
    showError("name-error", show && !data.validName ? copy.nameError || "Escribe tu nombre y apellido." : "");
    showError("attendance-error", show && !data.validAttendance ? copy.attendanceError || "Selecciona tu respuesta." : "");
    showError("count-error", show && !data.validTotal ? copy.countError || "Selecciona el total de asistentes." : "");
    if (show) nameInput.setAttribute("aria-invalid", String(!data.validName));
    else nameInput.removeAttribute("aria-invalid");
    choices.forEach((input) => { if (show) input.setAttribute("aria-invalid", String(!data.validAttendance)); else input.removeAttribute("aria-invalid"); });
    if (show && data.attendance === "yes") totalInput.setAttribute("aria-invalid", String(!data.validTotal));
    else totalInput.removeAttribute("aria-invalid");
  }

  function eventDetails() {
    const event = app.config.event || {};
    const date = app.text(event.dateLabel) || app.formatDate(event.date);
    const time = app.text(event.timeLabel) || (app.text(event.time) ? `${app.text(event.time)} hrs` : "");
    return [["Fecha", date], ["Hora", time], ["Lugar", app.text(event.venue?.name)]]
      .filter(([, value]) => value).map(([label, value]) => `${label}: ${value}`).join("\n");
  }

  function buildMessage(data) {
    const couple = [app.config.couple?.firstName, app.config.couple?.secondName].map(app.text).filter(Boolean).join(" y ");
    const template = data.attendance === "yes" ? copy.yesMessage : copy.noMessage;
    return replaceTokens(template, { couple, name: data.name, count: data.total, peopleLabel: peopleLabel(data.total), eventDetails: eventDetails() });
  }

  function hideCopyFallback() {
    fallback.hidden = true;
    copyArea.value = "";
  }

  function clearPreview() {
    currentMessage = "";
    messageOutput.textContent = "";
    preview.hidden = true;
    sendLink.removeAttribute("href");
    sendLink.setAttribute("aria-disabled", "true");
    copyButton.disabled = true;
    hideCopyFallback();
  }

  function renderPreview(data) {
    currentMessage = buildMessage(data);
    messageOutput.textContent = currentMessage;
    preview.hidden = false;
    sendLink.hidden = !phoneValid;
    sendLink.setAttribute("aria-disabled", String(!phoneValid));
    if (phoneValid) sendLink.href = `https://wa.me/${phone}?text=${encodeURIComponent(currentMessage)}`;
    else sendLink.removeAttribute("href");
    instructions.textContent = phoneValid ? copy.whatsappInstruction : copy.contactUnavailable;
    copyButton.disabled = false;
    hideCopyFallback();
    form.dataset.state = "preview";
  }

  function refresh(showErrors = attempted || prepared) {
    const data = readForm();
    updateErrors(data, showErrors);
    if (!data.valid) {
      clearPreview();
      form.dataset.state = "incomplete";
      if (prepared) announce("Revisa los campos indicados para actualizar tu respuesta.");
    } else if (prepared) {
      renderPreview(data);
      announce(copy.updatedAnnouncement || "Vista previa actualizada.");
    } else {
      clearPreview();
      form.dataset.state = "valid";
    }
    return data;
  }

  function syncAttendance() {
    const attending = selectedAttendance() === "yes";
    companionsField.hidden = !attending;
    totalInput.disabled = !attending;
    totalInput.required = attending;
    if (!attending) totalInput.value = "";
  }

  nameInput.addEventListener("input", () => refresh());
  choices.forEach((choice) => choice.addEventListener("change", () => { syncAttendance(); refresh(); }));
  totalInput.addEventListener("change", () => refresh());

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    attempted = true;
    const data = refresh(true);
    if (!data.valid) {
      announce("Revisa los campos indicados antes de preparar tu respuesta.");
      (!data.validName ? nameInput : !data.validAttendance ? choices[0] : totalInput).focus();
      return;
    }
    prepared = true;
    renderPreview(data);
    announce(phoneValid ? copy.previewAnnouncement : copy.contactUnavailable);
    preview.focus({ preventScroll: true });
    preview.scrollIntoView({ block: "nearest", behavior: "auto" });
  });

  // Un enlace nativo abre WhatsApp dentro del gesto del usuario, sin ventanas diferidas.
  sendLink.addEventListener("click", (event) => {
    const data = refresh(true);
    if (!prepared || !data.valid || !phoneValid) { event.preventDefault(); return; }
    renderPreview(data);
    form.dataset.state = "opening";
    announce(copy.openingAnnouncement);
    // El navegador sigue el href. No se envía ni se confirma ningún mensaje desde aquí.
  });

  copyButton.addEventListener("click", async () => {
    const data = refresh(true);
    if (!prepared || !data.valid) return;
    renderPreview(data);
    const message = currentMessage;
    copyButton.disabled = true;
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(message);
      if (currentMessage === message) announce(copy.copiedAnnouncement);
    } catch {
      if (currentMessage === message) {
        fallback.hidden = false;
        copyArea.value = message;
        copyArea.focus({ preventScroll: true });
        copyArea.select();
        announce(copy.copyManual);
      }
    } finally {
      copyButton.disabled = !currentMessage;
    }
  });

  syncAttendance();
  refresh(false);
})();
