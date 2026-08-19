/** Frontend API client. VITE_API_URL overrides the API origin. In local Vite, /api is proxied to the backend. */

const configuredBase = import.meta.env.VITE_API_URL as string | undefined;
export const API_BASE_URL = (configuredBase ?? '').replace(/\/$/, '');

export class BackendError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.name = 'BackendError'; this.status = status; }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('auth_token');
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new BackendError(response.status, payload.message || 'Request failed');
    return payload as T;
  } catch (error) {
    if (error instanceof BackendError) throw error;
    throw new BackendError(0, 'Cannot reach the backend. Make sure the backend is running on port 8080.');
  }
}

export const backendAuth = {
  login: (email: string, password: string) => apiRequest<{ user: any; token: string }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  signup: (data: { email: string; password: string; name: string; role: 'student' | 'owner'; phone?: string; address?: string }) => apiRequest<{ user: any; token: string }>('/api/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
  me: () => apiRequest<{ user: any }>('/api/auth/me'),
};

export const backendHostels = {
  list: (params: Record<string, string | number | undefined> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== '') query.set(key, String(value)); });
    return apiRequest<{ results: any[] }>(`/api/hostels${query.toString() ? `?${query}` : ''}`);
  },
  get: (id: string) => apiRequest<{ property: any; rooms: any[] }>(`/api/hostels/${id}`),
};
