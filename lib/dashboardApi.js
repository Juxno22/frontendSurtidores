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

export const dashboardApi = {
  resumenDia(params) {
    return apiFetch(`/productividad/dashboard/resumen-dia${buildQuery(params)}`);
  },

  surtidoresRanking(params) {
    return apiFetch(`/productividad/dashboard/surtidores-ranking${buildQuery(params)}`);
  },

  sucursalesRanking(params) {
    return apiFetch(`/productividad/dashboard/sucursales-ranking${buildQuery(params)}`);
  },

  pendientes(params) {
    return apiFetch(`/productividad/dashboard/pendientes${buildQuery(params)}`);
  },

  tendencia(params) {
    return apiFetch(`/productividad/dashboard/tendencia${buildQuery(params)}`);
  }
};