(() => {
  "use strict";
  const app = window.Invitation;
  const imageSlot = document.getElementById("payment-qr-slot");
  const pending = document.getElementById("qr-pending");
  const actions = document.getElementById("qr-actions");
  const enlarge = document.getElementById("qr-enlarge");
  const download = document.getElementById("qr-download");
  const dialog = document.getElementById("qr-dialog");
  const fullImageSlot = document.getElementById("qr-full-image-slot");
  const closeButton = document.getElementById("qr-close");
  if (!app || !imageSlot || !pending || !actions || !enlarge || !download) return;

  const canUseDialog = Boolean(dialog && fullImageSlot && closeButton && typeof dialog.showModal === "function");
  let returnFocus = null;
  let imageReady = false;
  let image = null;
  let fullImage = null;

  function localImageUrl(value) {
    const source = app.text(value);
    // El original se sirve desde el mismo sitio, incluso en una subcarpeta de GitHub Pages.
    if (!source || /^(?:[a-z][a-z\d+.-]*:|[\/\\])/i.test(source) || source.includes("\\")) return null;
    try {
      const url = new URL(source, document.baseURI);
      if (!["http:", "https:", "file:"].includes(url.protocol) || url.origin !== window.location.origin) return null;
      if (url.username || url.password || !/\.(?:png|jpe?g|webp)$/i.test(url.pathname)) return null;
      return url;
    } catch { return null; }
  }

  function showPending() {
    imageReady = false;
    image?.remove();
    fullImage?.remove();
    image = fullImage = null;
    actions.hidden = true;
    pending.hidden = false;
    imageSlot.dataset.state = "pending";
    download.removeAttribute("href");
    if (dialog?.open && typeof dialog.close === "function") dialog.close();
  }

  function restoreFocus() {
    document.body.classList.remove("qr-open");
    if (returnFocus?.isConnected && !returnFocus.closest("[hidden]")) returnFocus.focus({ preventScroll: true });
    returnFocus = null;
  }

  if (canUseDialog) {
    enlarge.addEventListener("click", () => {
      if (!imageReady || dialog.open) return;
      returnFocus = document.activeElement;
      dialog.showModal();
      document.body.classList.add("qr-open");
      closeButton.focus({ preventScroll: true });
    });
    closeButton.addEventListener("click", () => dialog.close());
    dialog.addEventListener("close", restoreFocus);
    // Escape conserva el comportamiento nativo del diálogo y devuelve el foco al cerrar.
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    });
  }

  showPending();
  const source = localImageUrl(app.config.payment?.qrImage);
  // Sin original no se genera un sustituto ni se solicita una imagen inexistente.
  if (!source) return;

  const original = document.createElement("img");
  original.id = "payment-qr";
  original.alt = "QR bancario original para el pago de la cena";
  image = original;
  original.addEventListener("error", showPending, { once: true });
  original.addEventListener("load", () => {
    if (image !== original || !original.isConnected) return;
    if (!original.naturalWidth || !original.naturalHeight) { showPending(); return; }
    imageReady = true;
    pending.hidden = true;
    actions.hidden = false;
    imageSlot.dataset.state = "ready";
    download.href = source.href;
    try { download.download = decodeURIComponent(source.pathname.split("/").pop()) || "qr_pago_original.png"; }
    catch { download.download = "qr_pago_original.png"; }
    if (canUseDialog) {
      fullImage = document.createElement("img");
      fullImage.id = "qr-full-image";
      fullImage.alt = "QR bancario original ampliado, sin recortes";
      fullImage.addEventListener("error", showPending, { once: true });
      fullImage.src = source.href;
      fullImageSlot.append(fullImage);
    } else {
      // Un navegador sin <dialog> sigue permitiendo consultar el mismo archivo original.
      const link = document.createElement("a");
      link.id = enlarge.id;
      link.className = enlarge.className;
      link.href = source.href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Abrir QR original";
      link.setAttribute("aria-label", "Abrir QR original en otra pestaña");
      enlarge.replaceWith(link);
    }
  }, { once: true });
  original.src = source.href;
  imageSlot.append(original);
})();
