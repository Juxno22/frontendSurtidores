const TOKEN_KEY = 'productividad_token';
const USER_KEY = 'productividad_user';

export function saveSession({ token, user }) {
  if (typeof window === 'undefined') return;

  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  if (typeof window === 'undefined') return null;

  const raw = localStorage.getItem(USER_KEY);

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function redirectByRole(user) {
  if (!user) return '/login';

  if (user.rol === 'SURTIDOR') return '/surtidor';
  if (user.rol === 'ADMIN') return '/admin';
  if (user.rol === 'SUPERVISOR') return '/supervisor';
  if (user.rol === 'OPERATIVO') return '/login';

  return '/login';
}