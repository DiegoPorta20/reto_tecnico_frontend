# Módulo de Gestión de Trabajadores — Frontend

Sistema web para administrar el personal de la empresa: listar, registrar, editar, ver detalle, desactivar y reactivar trabajadores.

---

## Estructura del proyecto

```
front/
├── index.html                  ← Página principal
├── assets/
│   ├── css/
│   │   └── styles.css          ← Estilos personalizados
│   └── js/
│       ├── config.js           ← URL base del API (configurable)
│       ├── api.js              ← Capa de servicio AJAX
│       ├── utils.js            ← Utilidades (toast, formato, sanitización)
│       └── trabajadores.js     ← Lógica principal del módulo
└── sql/
    └── schema.sql              ← Script de base de datos con datos de prueba
```

---

## Tecnologías utilizadas

| Tecnología      | Versión  | Uso                                      |
|-----------------|----------|------------------------------------------|
| HTML5 / CSS3    | —        | Estructura y estilos                     |
| Bootstrap       | 5.3.2    | Layout, componentes y modales            |
| Font Awesome    | 6.5.0    | Iconografía                              |
| jQuery          | 3.7.1    | AJAX y manipulación del DOM              |

---

## Funcionalidades

| Funcionalidad            | Descripción                                                  |
|--------------------------|--------------------------------------------------------------|
| **Listar trabajadores**  | Tabla paginada con búsqueda y filtro por estado              |
| **Registrar**            | Modal con formulario y validaciones en tiempo real           |
| **Editar**               | Modal pre-cargado con datos actuales del trabajador          |
| **Ver detalle**          | Modal con información completa del trabajador                |
| **Desactivar**           | Baja lógica (`estado = 0`) con confirmación                  |
| **Reactivar**            | Restauración del trabajador inactivo con confirmación        |
| **Estadísticas**         | Tarjetas con totales: activos, inactivos y proyectos         |
| **Búsqueda**             | Filtrado por nombre, cargo o proyecto (debounce 280 ms)      |

---

## Endpoints consumidos

| Método   | Endpoint                             | Descripción                   |
|----------|--------------------------------------|-------------------------------|
| `GET`    | `/api/trabajadores`                  | Lista todos los trabajadores  |
| `POST`   | `/api/trabajadores`                  | Registra un trabajador        |
| `GET`    | `/api/trabajadores/{id}`             | Detalle de un trabajador      |
| `PUT`    | `/api/trabajadores/{id}`             | Actualiza datos               |
| `DELETE` | `/api/trabajadores/{id}`             | Desactiva (baja lógica)       |
| `PATCH`  | `/api/trabajadores/{id}/restaurar`   | Reactiva al trabajador        |
| `GET`    | `/api/cargos`                        | Lista de cargos               |
| `GET`    | `/api/proyectos`                     | Lista de proyectos            |

> **Formato esperado del API:** JSON. Las respuestas pueden ser directamente un array o un objeto `{ "data": [...] }`.

---

## Instrucciones de ejecución

### 1. Levantar el backend

Asegúrate de que tu servidor API esté corriendo. Por defecto se espera en:

```
http://localhost:8000
```

Si el puerto es diferente, edita **`assets/js/config.js`**:

```js
const CONFIG = Object.freeze({
  API_BASE_URL: 'http://localhost:TU_PUERTO/api',  // ← cambia aquí
  ITEMS_PER_PAGE: 10,
});
```

> **CORS:** el backend debe permitir peticiones desde el origen del frontend (cabecera `Access-Control-Allow-Origin`).

---

### 2. Abrir el frontend

El frontend es HTML estático. Ábrelo con cualquier servidor local:

**Opción A — VS Code Live Server (recomendado):**
1. Instala la extensión *Live Server* en VS Code.
2. Click derecho en `index.html` → **Open with Live Server**.
3. El navegador abrirá `http://127.0.0.1:5500` automáticamente.

**Opción B — Python:**
```bash
cd "reto tecnico/front"
python -m http.server 5500
# Abrir: http://localhost:5500
```

**Opción C — Node.js (npx serve):**
```bash
cd "reto tecnico/front"
npx serve .
# Sigue las instrucciones en consola
```

> **No** abras `index.html` directamente como archivo (`file://`), ya que el navegador bloqueará las peticiones AJAX por políticas CORS.

---

## Validaciones del formulario

| Campo              | Regla                                          |
|--------------------|------------------------------------------------|
| Nombre             | Obligatorio, mínimo 2 caracteres               |
| Apellido           | Obligatorio, mínimo 2 caracteres               |
| Correo electrónico | Obligatorio, formato `usuario@dominio.tld`     |
| Cargo              | Obligatorio, debe seleccionarse de la lista    |
| Proyecto           | Obligatorio, debe seleccionarse de la lista    |
| Teléfono           | Opcional                                       |

---

## Notas de seguridad

- Toda salida HTML generada dinámicamente pasa por `Utils.escapeHtml()` para prevenir XSS.
- Las peticiones incluyen la cabecera `X-Requested-With: XMLHttpRequest`.
- No se almacenan credenciales en el frontend.
