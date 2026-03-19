/**
 * api.js
 * Capa de servicio AJAX — centraliza todas las peticiones al backend.
 * Depende de: config.js (CONFIG.API_BASE_URL), jQuery.
 */
const API = (() => {
  const BASE_URL = CONFIG.API_BASE_URL;

  /**
   * Realiza una petición AJAX genérica.
   *
   * @param {string}      method   - Verbo HTTP: GET | POST | PUT | DELETE | PATCH
   * @param {string}      endpoint - Ruta relativa, ej.: "/trabajadores/5"
   * @param {Object|null} body     - Cuerpo de la petición (se serializa a JSON)
   * @returns {jqXHR} Promesa jQuery compatible con .done() / .fail() / .always()
   */
  function request(method, endpoint, body = null) {
    const options = {
      url:         `${BASE_URL}${endpoint}`,
      method:      method,
      contentType: 'application/json',
      headers: {
        Accept:            'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    };

    if (body !== null) {
      options.data = JSON.stringify(body);
    }

    return $.ajax(options);
  }

  /* ------------------------------------------------------------------
   * RECURSOS EXPUESTOS
   * ------------------------------------------------------------------ */
  return {

    /** Endpoints de trabajadores */
    trabajadores: {
      /** GET /api/trabajadores — lista completa */
      getAll:  ()           => request('GET',    '/trabajadores'),

      /** GET /api/trabajadores/:id — detalle */
      getById: (id)         => request('GET',    `/trabajadores/${id}`),

      /** POST /api/trabajadores — crear */
      create:  (data)       => request('POST',   '/trabajadores', data),

      /** PUT /api/trabajadores/:id — actualizar */
      update:  (id, data)   => request('PUT',    `/trabajadores/${id}`, data),

      /** DELETE /api/trabajadores/:id — baja lógica */
      remove:  (id)         => request('DELETE', `/trabajadores/${id}`),

      /** PATCH /api/trabajadores/:id/restaurar — reactivar */
      restore: (id)         => request('PATCH',  `/trabajadores/${id}/restaurar`),
    },

    /** Endpoints de cargos */
    cargos: {
      /** GET /api/cargos */
      getAll: () => request('GET', '/cargos'),
    },

    /** Endpoints de proyectos */
    proyectos: {
      /** GET /api/proyectos */
      getAll: () => request('GET', '/proyectos'),
    },
  };
})();
