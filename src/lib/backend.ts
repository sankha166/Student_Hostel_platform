/** Production API client. Set VITE_API_URL to the deployed backend URL. */

export const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export class BackendError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'BackendError';
    this.status = status;
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!API_BASE_URL) throw new BackendError(0, 'VITE_API_URL is not configured');
  const token = localStorage.getItem('auth_token');
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new BackendError(response.status, payload.message || 'Request failed');
  return payload as T;
}

export const backendAuth = {
  login: (email: string, password: string) =>
    apiRequest<{ user: any; token: string }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  signup: (data: { email: string; password: string; name: string; role: 'student' | 'owner'; phone?: string; address?: string }) =>
    apiRequest<{ user: any; token: string }>('/api/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
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
