import { apiFetch } from './api';

function buildQuery(params = {}) {
  const clean = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      clean[key] = value;
    }
  });

  const query = new URLSearchParams(clean).toString();

  return query ? `?${query}` : '';
}

export const sucursalesApi = {
  listarActivas() {
    return apiFetch('/sucursales?activo=1');
  },

  listar(params = {}) {
    return apiFetch(`/sucursales${buildQuery(params)}`);
  },

  crear(payload) {
    return apiFetch('/sucursales', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  actualizar(id, payload) {
    return apiFetch(`/sucursales/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  }
};

export const surtidoresApi = {
  listar(params = {}) {
    return apiFetch(`/surtidores${buildQuery(params)}`);
  },

  crear(payload) {
    return apiFetch('/surtidores', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  actualizar(id, payload) {
    return apiFetch(`/surtidores/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  }
};

export const sesionesApi = {
  obtenerActiva() {
    return apiFetch('/productividad/sesiones/activa');
  },

  iniciar(payload) {
    return apiFetch('/productividad/sesiones/iniciar', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  guardarAvance(id, payload) {
    return apiFetch(`/productividad/sesiones/${id}/avance`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  },

  finalizar(id, payload) {
    return apiFetch(`/productividad/sesiones/${id}/finalizar`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  cancelar(id, payload) {
    return apiFetch(`/productividad/sesiones/${id}/cancelar`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  listar(params = {}) {
    return apiFetch(`/productividad/sesiones${buildQuery(params)}`);
  },

  detalle(id) {
    return apiFetch(`/productividad/sesiones/${id}`);
  },

  eventos(id) {
    return apiFetch(`/productividad/sesiones/${id}/eventos`);
  },

  ajusteAdmin(id, payload) {
    return apiFetch(`/productividad/sesiones/${id}/ajuste-admin`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  }
};