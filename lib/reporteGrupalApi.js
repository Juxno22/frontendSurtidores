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

export const reporteGrupalApi = {
  listar(params = {}) {
    return apiFetch(`/productividad/reporte-grupal${buildQuery(params)}`);
  },

  guardar(payload) {
    return apiFetch('/productividad/reporte-grupal', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  importarExcel({ file, fecha = '', dryRun = false }) {
    const formData = new FormData();

    formData.append('archivo', file);

    if (fecha) {
      formData.append('fecha', fecha);
    }

    const query = buildQuery({
      dry_run: dryRun ? 1 : '',
      fecha
    });

    return apiFetch(`/productividad/reporte-grupal/importar-excel${query}`, {
      method: 'POST',
      body: formData
    });
  }
};