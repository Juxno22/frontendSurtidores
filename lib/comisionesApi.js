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


  async exportar(params = {}) {
    const response = await apiFetch(`/comisiones/exportar${buildQuery(params)}`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    const desde = params.desde || 'desde';
    const hasta = params.hasta || 'hasta';

    link.href = url;
    link.download = `comisiones_${desde}_${hasta}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
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
