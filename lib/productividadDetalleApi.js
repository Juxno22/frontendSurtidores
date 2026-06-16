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

export const productividadDetalleApi = {
  listarSurtidores(params = {}) {
    return apiFetch(`/productividad/detalle/surtidores${buildQuery(params)}`);
  },

  detalleSurtidor(id, params = {}) {
    return apiFetch(`/productividad/detalle/surtidores/${id}${buildQuery(params)}`);
  },

  listarChecadores(params = {}) {
    return apiFetch(`/checadores/detalle${buildQuery(params)}`);
  },

  detalleChecador(id, params = {}) {
    return apiFetch(`/checadores/detalle/${id}${buildQuery(params)}`);
  }
};