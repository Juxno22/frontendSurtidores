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

export const checadoresApi = {
  listar(params = {}) {
    return apiFetch(`/checadores${buildQuery(params)}`);
  },

  crear(payload) {
    return apiFetch('/checadores', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  actualizar(id, payload) {
    return apiFetch(`/checadores/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  },

  vincularUsuarios() {
    return apiFetch('/checadores/vincular-usuarios', {
      method: 'POST'
    });
  },

  validarExcel(file) {
    const formData = new FormData();
    formData.append('archivo', file);

    return apiFetch('/checadores/importar-excel?dry_run=1', {
      method: 'POST',
      body: formData
    });
  },

  importarExcel(file) {
    const formData = new FormData();
    formData.append('archivo', file);

    return apiFetch('/checadores/importar-excel', {
      method: 'POST',
      body: formData
    });
  },

  dashboard(params = {}) {
    return apiFetch(`/checadores/dashboard${buildQuery(params)}`);
  },

  reportes(params = {}) {
    return apiFetch(`/checadores/reportes${buildQuery(params)}`);
  }
};
