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

export const usuariosApi = {
  listar(params = {}) {
    return apiFetch(`/usuarios${buildQuery(params)}`);
  },

  detalle(id) {
    return apiFetch(`/usuarios/${id}`);
  },

  crear(payload) {
    return apiFetch('/usuarios', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  actualizar(id, payload) {
    return apiFetch(`/usuarios/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  },

  cambiarPassword(id, payload) {
    return apiFetch(`/usuarios/${id}/password`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  },

  cambiarMiPassword(payload) {
    return apiFetch('/usuarios/me/password', {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  }
};