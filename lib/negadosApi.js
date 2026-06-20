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

export const negadosApi = {
  motivos() {
    return apiFetch('/productividad/negados/motivos');
  },

  listar(params = {}) {
    return apiFetch(`/productividad/negados${buildQuery(params)}`);
  },

  revisar(id, payload) {
    return apiFetch(`/productividad/negados/${id}/revision`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  }
};
