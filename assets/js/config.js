/**
 * config.js
 * Configuración global de la aplicación.
 * Edita API_BASE_URL según la URL de tu backend.
 */
const CONFIG = Object.freeze({
  /** URL base del backend (sin barra al final) */
  API_BASE_URL: 'http://localhost:8000/api',

  /** Registros por página en la tabla */
  ITEMS_PER_PAGE: 10,
});
