const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

export async function postJson(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({ detail: 'Invalid response' }));
    if (!res.ok) {
        const err = json.detail || json;
        throw err;
    }
    return json;
}

export function saveAuth(payload) {
    if (payload.access) localStorage.setItem('access', payload.access);
    if (payload.refresh) localStorage.setItem('refresh', payload.refresh);
    if (payload.user) localStorage.setItem('user', JSON.stringify(payload.user));
}

export function getAccessToken() {
    return localStorage.getItem('access');
}

function parseJwt(token) {
    if (!token) return null;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
            '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

export function isAuthenticated() {
    const token = getAccessToken();
    if (!token) return false;
    const payload = parseJwt(token);
    if (!payload || !payload.exp) return false;
    return (payload.exp * 1000) > Date.now();
}

export function logout() {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('user');
}

// returns parsed user object stored at login (or null)
export function getUser() {
    try {
        const raw = localStorage.getItem('user');
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

export async function authFetch(path, options = {}) {
    const token = getAccessToken();
    const headers = options.headers ? { ...options.headers } : {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
        throw json || { detail: 'Request failed' };
    }
    return json;
}