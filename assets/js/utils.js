/**
 * utils.js
 * Funciones de utilidad reutilizables: notificaciones, formato, sanitización.
 * Depende de: jQuery.
 */
const Utils = (() => {
  /* ------------------------------------------------------------------
   * TOAST NOTIFICATIONS
   * ------------------------------------------------------------------ */

  const TOAST_CONFIG = {
    success: {
      icon:  '<i class="fa-solid fa-circle-check text-success me-2 fs-6"></i>',
      cssClass: 'toast-success',
    },
    error: {
      icon:  '<i class="fa-solid fa-circle-xmark text-danger me-2 fs-6"></i>',
      cssClass: 'toast-error',
    },
    warning: {
      icon:  '<i class="fa-solid fa-triangle-exclamation text-warning me-2 fs-6"></i>',
      cssClass: 'toast-warning',
    },
  };

  /**
   * Muestra una notificación toast no bloqueante.
   *
   * @param {'success'|'error'|'warning'} type
   * @param {string} message  Texto a mostrar (se sanitiza internamente).
   * @param {number} [duration=4000] Duración en ms antes de desaparecer.
   */
  function showToast(type, message, duration = 4000) {
    const cfg  = TOAST_CONFIG[type] ?? TOAST_CONFIG.success;
    const id   = `toast-${Date.now()}`;

    const html = `
      <div id="${id}" class="toast ${cfg.cssClass} show align-items-center" role="alert" aria-live="assertive">
        <div class="d-flex align-items-center px-3 py-2">
          ${cfg.icon}
          <span class="small fw-medium flex-grow-1">${escapeHtml(message)}</span>
          <button type="button" class="btn-close btn-sm ms-3 opacity-50" data-bs-dismiss="toast" aria-label="Cerrar"></button>
        </div>
      </div>`;

    const $toast = $(html).appendTo('#toastContainer');

    // Cerrar al hacer clic en el botón
    $toast.find('[data-bs-dismiss="toast"]').on('click', () => {
      $toast.fadeOut(250, () => $toast.remove());
    });

    // Auto-dismiss
    setTimeout(() => {
      $toast.fadeOut(300, () => $toast.remove());
    }, duration);
  }

  /* ------------------------------------------------------------------
   * SANITIZACIÓN / SEGURIDAD
   * ------------------------------------------------------------------ */

  /**
   * Escapa caracteres especiales HTML para prevenir XSS.
   *
   * @param {*} str
   * @returns {string}
   */
  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ------------------------------------------------------------------
   * HELPERS DE FORMATO
   * ------------------------------------------------------------------ */

  /**
   * Obtiene las iniciales (máximo 2 caracteres) del nombre y apellido.
   *
   * @param {string} nombre
   * @param {string} apellido
   * @returns {string}
   */
  function getInitials(nombre, apellido) {
    const n = nombre   ? nombre.charAt(0).toUpperCase()   : '';
    const a = apellido ? apellido.charAt(0).toUpperCase() : '';
    return n + a;
  }

  /**
   * Formatea una cadena de fecha ISO a formato legible en español (Perú).
   *
   * @param {string|null} dateString
   * @returns {string}
   */
  function formatDate(dateString) {
    if (!dateString) return '—';
    // El backend devuelve formato "DD/MM/YYYY HH:mm" — se retorna directamente
    if (/^\d{2}\/\d{2}\/\d{4}/.test(dateString)) return dateString;
    try {
      return new Date(dateString).toLocaleDateString('es-PE', {
        year:  'numeric',
        month: 'long',
        day:   'numeric',
      });
    } catch {
      return dateString;
    }
  }

  /**
   * Genera el HTML del badge de estado (Activo / Inactivo).
   *
   * @param {number|string} estado  1 = activo, 0 = inactivo
   * @returns {string} HTML del badge
   */
  function badgeEstado(activo) {
    const esActivo = activo === true || parseInt(activo, 10) === 1;
    return esActivo
      ? '<span class="badge badge-activo rounded-pill px-2 py-1">' +
          '<i class="fa-solid fa-circle fa-2xs me-1"></i>Activo</span>'
      : '<span class="badge badge-inactivo rounded-pill px-2 py-1">' +
          '<i class="fa-solid fa-circle fa-2xs me-1"></i>Inactivo</span>';
  }

  /* ------------------------------------------------------------------
   * FECHA EN NAVBAR
   * ------------------------------------------------------------------ */

  /**
   * Escribe la fecha actual en el elemento #currentDate del navbar.
   */
  function setCurrentDate() {
    const now       = new Date();
    const formatted = now.toLocaleDateString('es-PE', {
      weekday: 'long',
      year:    'numeric',
      month:   'long',
      day:     'numeric',
    });
    // Capitalize first letter
    $('#currentDate').text(formatted.charAt(0).toUpperCase() + formatted.slice(1));
  }

  /* ------------------------------------------------------------------
   * API PÚBLICA
   * ------------------------------------------------------------------ */
  return {
    showToast,
    escapeHtml,
    getInitials,
    formatDate,
    badgeEstado,
    setCurrentDate,
  };
})();
