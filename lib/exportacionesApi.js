import { getToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

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

function getFallbackFilename(filenameBase, formato = 'xlsx') {
  const safe = String(filenameBase || 'reporte')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();

  return `${safe}.${formato}`;
}

function getFilenameFromHeader(contentDisposition) {
  if (!contentDisposition) return null;

  const match = contentDisposition.match(/filename="?([^"]+)"?/i);

  return match?.[1] || null;
}

export async function downloadExport(path, params = {}, filenameBase = 'reporte') {
  const token = getToken();
  const formato = params.formato || 'xlsx';

  const response = await fetch(`${API_URL}${path}${buildQuery(params)}`, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  if (!response.ok) {
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const data = await response.json();
      throw new Error(data.message || 'No se pudo descargar el archivo.');
    }

    throw new Error('No se pudo descargar el archivo.');
  }

  const blob = await response.blob();

  const filename =
    getFilenameFromHeader(response.headers.get('content-disposition')) ||
    getFallbackFilename(filenameBase, formato);

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
}

export const exportacionesApi = {
  dashboardDia(params) {
    return downloadExport(
      '/productividad/exportar/dashboard-dia',
      params,
      `dashboard_dia_${params.fecha}`
    );
  },

  concentradoSurtidores(params) {
    return downloadExport(
      '/productividad/exportar/concentrado-surtidores',
      params,
      `concentrado_surtidores_${params.fecha}`
    );
  },

  concentradoSucursales(params) {
    return downloadExport(
      '/productividad/exportar/concentrado-sucursales',
      params,
      `concentrado_sucursales_${params.fecha}`
    );
  },

  comparativo(params) {
    return downloadExport(
      '/productividad/exportar/comparativo',
      params,
      `comparativo_productividad_${params.fecha}`
    );
  },

  sesiones(params) {
    const suffix = params.fecha || `${params.desde}_a_${params.hasta}`;

    return downloadExport(
      '/productividad/exportar/sesiones',
      params,
      `sesiones_productividad_${suffix}`
    );
  }
};