const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

export async function postJson(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({ detail: 'Invalid response' }));
    if (!res.ok) {
        throw json.detail || json;
    }
    return json;
}

export function saveAuth(payload) {
    if (payload.access)  localStorage.setItem('access', payload.access);
    if (payload.refresh) localStorage.setItem('refresh', payload.refresh);
    if (payload.user)    localStorage.setItem('user', JSON.stringify(payload.user));
}

export function getAccessToken() {
    return localStorage.getItem('access');
}

function parseJwt(token) {
    if (!token) return null;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64).split('').map(c =>
                '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            ).join('')
        );
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

// FIX F-06: Read role from JWT payload, not from localStorage user object
// This prevents role spoofing via devtools.
export function getRoleFromToken() {
    const token = getAccessToken();
    const payload = parseJwt(token);
    return payload?.role || null;
}

export function logout() {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('user');
}

export function getUser() {
    try {
        const raw = localStorage.getItem('user');
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

// FIX F-05: Token refresh logic
// Attempts to use the refresh token to get a new access token.
async function refreshAccessToken() {
    const refresh = localStorage.getItem('refresh');
    if (!refresh) return false;
    try {
        const res = await fetch(`${API_BASE}/api/auth/token/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh }),
        });
        if (!res.ok) return false;
        const data = await res.json();
        if (data.access) {
            localStorage.setItem('access', data.access);
            return true;
        }
        return false;
    } catch {
        return false;
    }
}

// FIX F-05: authFetch now auto-refreshes on 401 and retries once
export async function authFetch(path, options = {}) {
    const makeRequest = (token) => {
        const headers = { ...(options.headers || {}) };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        return fetch(`${API_BASE}${path}`, { ...options, headers });
    };

    let token = getAccessToken();
    let res = await makeRequest(token);

    // If 401, attempt to refresh token and retry once
    if (res.status === 401) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
            token = getAccessToken();
            res = await makeRequest(token);
        } else {
            logout();
            window.location.href = '/';
            return;
        }
    }

    const json = await res.json().catch(() => null);
    if (!res.ok) {
        throw json || { detail: 'Request failed' };
    }
    return json;
}
