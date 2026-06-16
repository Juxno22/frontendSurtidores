import { getToken, clearSession } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function apiFetch(path, options = {}) {
  const token = getToken();

  const headers = {
    ...(options.headers || {})
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    if (!response.ok) {
      throw new Error('Error inesperado del servidor');
    }

    return response;
  }

  const data = await response.json();

  if (response.status === 401) {
    clearSession();

    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }

    throw new Error(data.message || 'Sesión expirada');
  }

  if (!response.ok || data.ok === false) {
    throw new Error(data.message || 'Error en la solicitud');
  }

  return data;
}

export const authApi = {
  login(payload) {
    return apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  me() {
    return apiFetch('/auth/me');
  }
};