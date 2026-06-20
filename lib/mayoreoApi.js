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

function buildFormData(file) {
  const formData = new FormData();
  formData.append('archivo', file);
  return formData;
}

export const mayoreoApi = {
  resumen(params = {}) {
    return apiFetch(`/mayoreo/resumen${buildQuery(params)}`);
  },

  reportesSurtidores(params = {}) {
    return apiFetch(`/mayoreo/reportes-surtidores${buildQuery(params)}`);
  },

  productividad(params = {}) {
    return apiFetch(`/mayoreo/productividad${buildQuery(params)}`);
  },

  negados(params = {}) {
    return apiFetch(`/mayoreo/negados${buildQuery(params)}`);
  },

  pendientesVincular(params = {}) {
    return apiFetch(`/mayoreo/pendientes-vincular${buildQuery(params)}`);
  },

  validarReporteSurtidores(file) {
    return apiFetch('/mayoreo/reportes-surtidores/importar-excel?dry_run=1', {
      method: 'POST',
      body: buildFormData(file)
    });
  },

  importarReporteSurtidores(file) {
    return apiFetch('/mayoreo/reportes-surtidores/importar-excel', {
      method: 'POST',
      body: buildFormData(file)
    });
  },

  validarNegados(file) {
    return apiFetch('/mayoreo/negados/importar-excel?dry_run=1', {
      method: 'POST',
      body: buildFormData(file)
    });
  },

  importarNegados(file) {
    return apiFetch('/mayoreo/negados/importar-excel', {
      method: 'POST',
      body: buildFormData(file)
    });
  }
};
