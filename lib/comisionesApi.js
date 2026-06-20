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

export const comisionesApi = {
  calcular(payload) {
    return apiFetch('/comisiones/calcular', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  periodos(params = {}) {
    return apiFetch(`/comisiones/periodos${buildQuery(params)}`);
  },

  detallePeriodo(id) {
    return apiFetch(`/comisiones/periodos/${id}`);
  },

  incidencias(params = {}) {
    return apiFetch(`/comisiones/incidencias${buildQuery(params)}`);
  },

  crearIncidencia(payload) {
    return apiFetch('/comisiones/incidencias', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  resolverIncidencia(id, payload) {
    return apiFetch(`/comisiones/incidencias/${id}/resolver`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  }
};
