/**
 * trabajadores.js
 * Módulo principal del CRUD de trabajadores.
 * Depende de: config.js, api.js, utils.js, jQuery, Bootstrap 5.
 *
 * Patrón IIFE — evita contaminar el scope global.
 */
const TrabajadoresModule = (() => {
  /* ------------------------------------------------------------------
   * ESTADO INTERNO
   * ------------------------------------------------------------------ */
  let _trabajadores  = [];     // Lista completa obtenida del API
  let _cargos        = [];
  let _proyectos     = [];
  let _currentId     = null;   // ID en edición / acción pendiente
  let _pendingAction = null;   // 'delete' | 'restore'
  let _currentPage   = 1;
  const PER_PAGE     = CONFIG.ITEMS_PER_PAGE;

  /* ------------------------------------------------------------------
   * REFERENCIAS DOM (inicializadas después de que el DOM esté listo)
   * ------------------------------------------------------------------ */
  let $tbody, $loadingState, $emptyState, $searchInput, $filtroEstado;
  let modalTrabajador, modalDetalle, modalConfirmar;

  /* ====================================================================
   * INIT
   * ==================================================================== */
  function init() {
    // Capturar referencias DOM
    $tbody         = $('#tbodyTrabajadores');
    $loadingState  = $('#loadingState');
    $emptyState    = $('#emptyState');
    $searchInput   = $('#searchInput');
    $filtroEstado  = $('#filtroEstado');

    // Instanciar modales Bootstrap
    modalTrabajador = new bootstrap.Modal('#modalTrabajador');
    modalDetalle    = new bootstrap.Modal('#modalDetalle');
    modalConfirmar  = new bootstrap.Modal('#modalConfirmar');

    Utils.setCurrentDate();
    _bindEvents();
    _loadCatalogos();
    _loadTrabajadores();
  }

  /* ====================================================================
   * CARGA DE DATOS
   * ==================================================================== */

  /** Obtiene cargos y proyectos en paralelo para poblar los selects */
  function _loadCatalogos() {
    $.when(API.cargos.getAll(), API.proyectos.getAll())
      .done((resCargos, resProyectos) => {
        _cargos    = _extractArray(resCargos[0]);
        _proyectos = _extractArray(resProyectos[0]);
        _populateSelects();
        $('#statProyectos').text(_proyectos.length);
      })
      .fail(() => {
        Utils.showToast('warning', 'No se pudieron cargar los catálogos de cargos y proyectos.');
      });
  }

  /** Carga la lista principal de trabajadores */
  function _loadTrabajadores() {
    _showLoading(true);

    API.trabajadores.getAll()
      .done((res) => {
        _trabajadores = _extractArray(res);
        _currentPage  = 1;
        _render();
        _updateStats();
      })
      .fail(() => {
        Utils.showToast('error', 'Error al cargar los trabajadores. Verifica la conexión con el servidor.');
        _showList(false);
      })
      .always(() => _showLoading(false));
  }

  /* ====================================================================
   * SELECTS (CARGOS / PROYECTOS)
   * ==================================================================== */
  function _populateSelects() {
    const cargoOpts    = _cargos.map(c =>
      `<option value="${c.id}">${Utils.escapeHtml(c.nombre)}</option>`
    ).join('');

    const proyectoOpts = _proyectos.map(p =>
      `<option value="${p.id}">${Utils.escapeHtml(p.nombre)}</option>`
    ).join('');

    $('#selectCargo').html(
      '<option value="">Seleccionar cargo...</option>' + cargoOpts
    );
    $('#selectProyecto').html(
      '<option value="">Seleccionar proyecto...</option>' + proyectoOpts
    );
  }

  /* ====================================================================
   * FILTRADO Y PAGINACIÓN
   * ==================================================================== */

  /** Aplica los filtros activos (búsqueda + estado) */
  function _getFiltered() {
    const search = $searchInput.val().trim().toLowerCase();
    const estado = $filtroEstado.val();

    return _trabajadores.filter((t) => {
      const nombre   = `${t.nombre} ${t.apellido}`.toLowerCase();
      const cargo    = (t.cargo?.nombre    ?? '').toLowerCase();
      const proyecto = (t.proyecto?.nombre ?? '').toLowerCase();

      const matchSearch = !search
        || nombre.includes(search)
        || cargo.includes(search)
        || proyecto.includes(search);

      const matchEstado = estado === ''
        || (estado === '1' && t.activo === true)
        || (estado === '0' && t.activo === false);

      return matchSearch && matchEstado;
    });
  }

  /** Retorna el subconjunto de la página actual */
  function _getPaged(list) {
    const start = (_currentPage - 1) * PER_PAGE;
    return list.slice(start, start + PER_PAGE);
  }

  /* ====================================================================
   * RENDERIZADO
   * ==================================================================== */
  function _render() {
    const filtered   = _getFiltered();
    const paged      = _getPaged(filtered);
    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));

    // Corregir página si quedó fuera de rango tras filtrar
    if (_currentPage > totalPages) {
      _currentPage = totalPages;
      return _render();
    }

    // Contadores visibles
    $('#countShowing').text(paged.length);
    $('#countTotal').text(filtered.length);
    $('#currentPage').text(_currentPage);
    $('#totalPages').text(totalPages);

    if (filtered.length === 0) {
      $tbody.empty();
      _showList(false);
      _renderPagination(totalPages);
      return;
    }

    _showList(true);
    const startIdx = (_currentPage - 1) * PER_PAGE;
    $tbody.html(paged.map((t, i) => _buildRow(t, startIdx + i + 1)).join(''));
    _renderPagination(totalPages);
  }

  /** Construye el HTML de una fila de la tabla */
  function _buildRow(t, idx) {
    const nombre    = Utils.escapeHtml(t.nombre);
    const apellido  = Utils.escapeHtml(t.apellido);
    const email     = Utils.escapeHtml(t.email ?? '');
    const cargo     = Utils.escapeHtml(t.cargo    ?? '—');
    const proyecto  = Utils.escapeHtml(t.proyecto ?? '—');
    const initials  = Utils.getInitials(t.nombre, t.apellido);
    const badge     = Utils.badgeEstado(t.activo);
    const isActive  = t.activo === true;

    const btnToggle = isActive
      ? `<button class="btn btn-outline-danger btn-action btn-desactivar ms-1"
              data-id="${t.id}" title="Desactivar">
           <i class="fa-solid fa-ban fa-xs"></i>
         </button>`
      : `<button class="btn btn-outline-success btn-action btn-restaurar ms-1"
              data-id="${t.id}" title="Reactivar">
           <i class="fa-solid fa-rotate-right fa-xs"></i>
         </button>`;

    return `
      <tr data-id="${t.id}">
        <td class="ps-4 text-muted" style="width:50px">${idx}</td>
        <td>
          <div class="d-flex align-items-center gap-2">
            <div class="worker-avatar">${initials}</div>
            <div>
              <div class="worker-name">${nombre} ${apellido}</div>
              <div class="worker-email">${email}</div>
            </div>
          </div>
        </td>
        <td>${cargo}</td>
        <td>${proyecto}</td>
        <td>${badge}</td>
        <td class="text-center" style="white-space:nowrap">
          <button class="btn btn-outline-info btn-action btn-ver"
              data-id="${t.id}" title="Ver detalle">
            <i class="fa-solid fa-eye fa-xs"></i>
          </button>
          <button class="btn btn-outline-primary btn-action btn-editar ms-1"
              data-id="${t.id}" title="Editar">
            <i class="fa-solid fa-pen-to-square fa-xs"></i>
          </button>
          ${btnToggle}
        </td>
      </tr>`;
  }

  /** Renderiza los controles de paginación */
  function _renderPagination(totalPages) {
    const $list = $('#paginationList').empty();

    if (totalPages <= 1) return;

    const prev = _currentPage - 1;
    const next = _currentPage + 1;

    $list.append(
      `<li class="page-item ${_currentPage === 1 ? 'disabled' : ''}">
         <a class="page-link" href="#" data-page="${prev}" aria-label="Anterior">
           <i class="fa-solid fa-chevron-left fa-xs"></i>
         </a>
       </li>`
    );

    for (let p = 1; p <= totalPages; p++) {
      $list.append(
        `<li class="page-item ${p === _currentPage ? 'active' : ''}">
           <a class="page-link" href="#" data-page="${p}">${p}</a>
         </li>`
      );
    }

    $list.append(
      `<li class="page-item ${_currentPage === totalPages ? 'disabled' : ''}">
         <a class="page-link" href="#" data-page="${next}" aria-label="Siguiente">
           <i class="fa-solid fa-chevron-right fa-xs"></i>
         </a>
       </li>`
    );
  }

  /** Sincroniza las tarjetas de estadísticas */
  function _updateStats() {
    const total    = _trabajadores.length;
    const activos  = _trabajadores.filter(t => t.activo === true).length;
    $('#statTotal').text(total);
    $('#statActivos').text(activos);
    $('#statInactivos').text(total - activos);
  }

  /* ====================================================================
   * ESTADOS DE VISTA (loading / lista / vacío)
   * ==================================================================== */
  function _showLoading(show) {
    $loadingState.toggleClass('d-none', !show);
    if (show) {
      $tbody.empty();
      $emptyState.addClass('d-none');
    }
  }

  function _showList(hasResults) {
    $emptyState.toggleClass('d-none', hasResults);
  }

  /* ====================================================================
   * MODAL: CREAR TRABAJADOR
   * ==================================================================== */
  function _openCreateModal() {
    _currentId = null;
    $('#modalTrabajadorLabel').html(
      '<i class="fa-solid fa-user-plus me-2"></i>Registrar Trabajador'
    );
    $('#iconGuardar').attr('class', 'fa-solid fa-user-plus me-1');
    _populateSelects();
    _resetForm();
    modalTrabajador.show();
  }

  /* ====================================================================
   * MODAL: EDITAR TRABAJADOR
   * ==================================================================== */
  function _openEditModal(id) {
    _currentId = id;
    $('#modalTrabajadorLabel').html(
      '<i class="fa-solid fa-pen-to-square me-2"></i>Editar Trabajador'
    );
    $('#iconGuardar').attr('class', 'fa-solid fa-floppy-disk me-1');
    _populateSelects();
    _resetForm();

    API.trabajadores.getById(id)
      .done((res) => {
        const t = res.data ?? res;
        $('#trabajadorId').val(t.id);
        $('#inputNombre').val(t.nombre   ?? '');
        $('#inputApellido').val(t.apellido ?? '');
        $('#inputDni').val(t.dni           ?? '');
        $('#inputEmail').val(t.email       ?? '');
        $('#inputTelefono').val(t.telefono ?? '');
        $('#selectCargo').val(t.cargo_id ?? '');
        $('#selectProyecto').val(t.proyecto_id ?? '');
        modalTrabajador.show();
      })
      .fail(() => {
        Utils.showToast('error', 'No se pudo cargar la información del trabajador.');
      });
  }

  /* ====================================================================
   * MODAL: DETALLE TRABAJADOR
   * ==================================================================== */
  function _openDetailModal(id) {
    // Mostrar modal con spinner mientras carga
    $('#modalDetalleBody').html(`
      <div class="text-center py-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
      </div>`);
    modalDetalle.show();

    API.trabajadores.getById(id)
      .done((res) => {
        const t = res.data ?? res;
        $('#modalDetalleBody').html(_buildDetailHtml(t));
      })
      .fail(() => {
        $('#modalDetalleBody').html(
          '<p class="text-danger text-center py-3">' +
          '<i class="fa-solid fa-triangle-exclamation me-1"></i>' +
          'No se pudo cargar el detalle del trabajador.</p>'
        );
      });
  }

  /** Construye el HTML del cuerpo del modal de detalle */
  function _buildDetailHtml(t) {
    const nombre   = Utils.escapeHtml(`${t.nombre ?? ''} ${t.apellido ?? ''}`).trim();
    const dni      = Utils.escapeHtml(t.dni      ?? '—');
    const email    = Utils.escapeHtml(t.email    ?? '—');
    const telefono = Utils.escapeHtml(t.telefono ?? '—');
    const cargo    = Utils.escapeHtml(t.cargo    ?? '—');
    const proyecto = Utils.escapeHtml(t.proyecto ?? '—');
    const badge    = Utils.badgeEstado(t.activo);
    const fecha    = Utils.formatDate(t.created_at);
    const initials = Utils.getInitials(t.nombre, t.apellido);

    return `
      <!-- Cabecera del detalle -->
      <div class="text-center mb-4">
        <div class="detail-avatar mb-2">${initials}</div>
        <h5 class="fw-bold mb-1">${nombre}</h5>
        <div>${badge}</div>
      </div>

      <!-- Campos -->
      <div class="detail-section">
        <div class="row g-3">
          ${_detailField('fa-id-card',          'DNI',                dni)}
          ${_detailField('fa-envelope',        'Correo electrónico', email)}
          ${_detailField('fa-phone',            'Teléfono',           telefono)}
          ${_detailField('fa-briefcase',        'Cargo',              cargo)}
          ${_detailField('fa-diagram-project',  'Proyecto',           proyecto)}
          ${_detailField('fa-calendar-plus',    'Fecha de registro',  fecha)}
        </div>
      </div>`;
  }

  /** Genera un campo de detalle (ícono + etiqueta + valor) */
  function _detailField(icon, label, value) {
    return `
      <div class="col-sm-6">
        <div class="detail-label">
          <i class="fa-solid ${icon} me-1"></i>${label}
        </div>
        <div class="detail-value">${value}</div>
      </div>`;
  }

  /* ====================================================================
   * GUARDAR (CREAR / ACTUALIZAR)
   * ==================================================================== */
  function _saveTrabajador() {
    if (!_validateForm()) return;

    const data = {
      nombre:      $('#inputNombre').val().trim(),
      apellido:    $('#inputApellido').val().trim(),
      dni:         $('#inputDni').val().trim(),
      email:       $('#inputEmail').val().trim(),
      telefono:    $('#inputTelefono').val().trim() || null,
      cargo_id:    parseInt($('#selectCargo').val(), 10),
      proyecto_id: parseInt($('#selectProyecto').val(), 10),
    };

    _setGuardando(true);

    const request = _currentId
      ? API.trabajadores.update(_currentId, data)
      : API.trabajadores.create(data);

    request
      .done(() => {
        const msg = _currentId
          ? 'Trabajador actualizado correctamente.'
          : 'Trabajador registrado correctamente.';
        Utils.showToast('success', msg);
        modalTrabajador.hide();
        _loadTrabajadores();
      })
      .fail((xhr) => {
        const res    = xhr.responseJSON;
        const errors = res?.errors;
        let msg      = res?.message ?? 'Ocurrió un error al guardar. Intenta nuevamente.';
        // Mostrar el primer error de validación del campo si existe (422)
        if (errors) {
          const firstErrors = Object.values(errors)[0];
          if (Array.isArray(firstErrors) && firstErrors.length) {
            msg = firstErrors[0];
          }
        }
        Utils.showToast('error', msg);
      })
      .always(() => _setGuardando(false));
  }

  /** Activa o desactiva el estado de carga del botón Guardar */
  function _setGuardando(loading) {
    $('#spinnerGuardar').toggleClass('d-none', !loading);
    $('#iconGuardar').toggleClass('d-none', loading);
    $('#btnGuardarTrabajador').prop('disabled', loading);
  }

  /* ====================================================================
   * DESACTIVAR / RESTAURAR
   * ==================================================================== */
  function _openConfirmDesactivar(id) {
    _currentId     = id;
    _pendingAction = 'delete';

    $('#confirmarIcono').html('<i class="fa-solid fa-triangle-exclamation fa-3x text-danger"></i>');
    $('#confirmarTitulo').text('¿Desactivar trabajador?');
    $('#confirmarMensaje').text('Esta acción desactivará al trabajador. Podrás reactivarlo en cualquier momento.');
    $('#textConfirmarAccion').text('Desactivar');
    $('#btnConfirmarAccion')
      .removeClass('btn-success')
      .addClass('btn-danger');

    modalConfirmar.show();
  }

  function _openConfirmRestaurar(id) {
    _currentId     = id;
    _pendingAction = 'restore';

    $('#confirmarIcono').html('<i class="fa-solid fa-rotate-right fa-3x text-success"></i>');
    $('#confirmarTitulo').text('¿Reactivar trabajador?');
    $('#confirmarMensaje').text('Esta acción reactivará al trabajador y estará activo nuevamente en el sistema.');
    $('#textConfirmarAccion').text('Reactivar');
    $('#btnConfirmarAccion')
      .removeClass('btn-danger')
      .addClass('btn-success');

    modalConfirmar.show();
  }

  function _ejecutarAccionConfirmada() {
    _setConfirmando(true);

    const request = _pendingAction === 'delete'
      ? API.trabajadores.remove(_currentId)
      : API.trabajadores.restore(_currentId);

    const successMsg = _pendingAction === 'delete'
      ? 'Trabajador desactivado correctamente.'
      : 'Trabajador reactivado correctamente.';

    request
      .done(() => {
        Utils.showToast('success', successMsg);
        modalConfirmar.hide();
        _loadTrabajadores();
      })
      .fail((xhr) => {
        const msg = xhr.responseJSON?.message ?? 'Ocurrió un error. Intenta nuevamente.';
        Utils.showToast('error', msg);
      })
      .always(() => _setConfirmando(false));
  }

  function _setConfirmando(loading) {
    $('#spinnerConfirmar').toggleClass('d-none', !loading);
    $('#btnConfirmarAccion').prop('disabled', loading);
  }

  /* ====================================================================
   * VALIDACIÓN DEL FORMULARIO
   * ==================================================================== */
  function _validateForm() {
    const rules = [
      {
        $el:  $('#inputNombre'),
        test: (v) => v.trim().length >= 2,
        msg:  null, // usa el invalid-feedback del HTML
      },
      {
        $el:  $('#inputApellido'),
        test: (v) => v.trim().length >= 2,
        msg:  null,
      },
      {
        $el:  $('#inputDni'),
        test: (v) => /^\d{8}$/.test(v.trim()),
        msg:  null,
      },
      {
        $el:  $('#inputEmail'),
        test: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
        msg:  null,
      },
      {
        $el:  $('#selectCargo'),
        test: (v) => v !== '',
        msg:  null,
      },
      {
        $el:  $('#selectProyecto'),
        test: (v) => v !== '',
        msg:  null,
      },
    ];

    let valid = true;

    rules.forEach(({ $el, test }) => {
      const ok = test($el.val() ?? '');
      $el.toggleClass('is-invalid', !ok)
         .toggleClass('is-valid',    ok);
      if (!ok) valid = false;
    });

    return valid;
  }

  function _resetForm() {
    const form = document.getElementById('formTrabajador');
    if (form) form.reset();
    $('#formTrabajador .is-invalid, #formTrabajador .is-valid')
      .removeClass('is-invalid is-valid');
    $('#trabajadorId').val('');
  }

  /* ====================================================================
   * BINDING DE EVENTOS
   * ==================================================================== */
  function _bindEvents() {

    // Botón nuevo trabajador
    $('#btnNuevoTrabajador').on('click', _openCreateModal);

    // Botón refrescar
    $('#btnRefrescar').on('click', () => {
      $searchInput.val('');
      $filtroEstado.val('');
      _loadTrabajadores();
    });

    // Guardar (crear / editar)
    $('#btnGuardarTrabajador').on('click', _saveTrabajador);

    // Limpiar validación al escribir
    $('#formTrabajador').on('input change', 'input, select', function () {
      $(this).removeClass('is-invalid is-valid');
    });

    // Acciones de la tabla (delegado en tbody)
    $tbody.on('click', '.btn-ver',         function () { _openDetailModal($(this).data('id')); });
    $tbody.on('click', '.btn-editar',      function () { _openEditModal($(this).data('id')); });
    $tbody.on('click', '.btn-desactivar',  function () { _openConfirmDesactivar($(this).data('id')); });
    $tbody.on('click', '.btn-restaurar',   function () { _openConfirmRestaurar($(this).data('id')); });

    // Confirmar acción (desactivar / restaurar)
    $('#btnConfirmarAccion').on('click', _ejecutarAccionConfirmada);

    // Búsqueda con debounce
    $searchInput.on('input', _debounce(() => {
      _currentPage = 1;
      _render();
    }, 280));

    // Filtro por estado
    $filtroEstado.on('change', () => {
      _currentPage = 1;
      _render();
    });

    // Paginación
    $('#paginationList').on('click', 'a.page-link', function (e) {
      e.preventDefault();
      const page       = parseInt($(this).data('page'), 10);
      const totalPages = Math.max(1, Math.ceil(_getFiltered().length / PER_PAGE));
      if (!isNaN(page) && page >= 1 && page <= totalPages) {
        _currentPage = page;
        _render();
        // Scroll suave al top de la tabla
        document.getElementById('tablaTrabajadores')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });

    // Limpiar estado del modal de confirmación al cerrarse
    $('#modalConfirmar').on('hidden.bs.modal', () => {
      _setConfirmando(false);
      _pendingAction = null;
    });

    // Limpiar formulario al cerrar modal de trabajador
    $('#modalTrabajador').on('hidden.bs.modal', () => {
      _resetForm();
      _setGuardando(false);
    });
  }

  /* ====================================================================
   * HELPERS PRIVADOS
   * ==================================================================== */

  /**
   * Extrae el array de datos de una respuesta que puede ser
   * directamente un array o un objeto { data: [...] }.
   *
   * @param {Array|Object} response
   * @returns {Array}
   */
  function _extractArray(response) {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    return [];
  }

  /**
   * Crea una versión con debounce de una función.
   *
   * @param {Function} fn
   * @param {number}   delay  Milisegundos de espera
   * @returns {Function}
   */
  function _debounce(fn, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  /* ====================================================================
   * API PÚBLICA DEL MÓDULO
   * ==================================================================== */
  return { init };
})();

/* ------------------------------------------------------------------
 * Arrancar el módulo cuando el DOM esté listo
 * ------------------------------------------------------------------ */
$(document).ready(() => TrabajadoresModule.init());
