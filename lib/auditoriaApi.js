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

export const auditoriaApi = {
  listar(params = {}) {
    return apiFetch(`/auditoria${buildQuery(params)}`);
  },

  detalle(id) {
    return apiFetch(`/auditoria/${id}`);
  }
};