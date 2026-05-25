const API_BASE = '/api';

let accessToken: string | null = null;

export function setToken(token: string) { accessToken = token; }
export function getToken() { return accessToken; }

async function request(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as Record<string, string>) };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  if (res.status === 204) return null;
  return res.json();
}

export async function login(email: string) {
  const data = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email }) });
  accessToken = data.accessToken;
  return data;
}

export async function getTasks() {
  return request('/tasks');
}

export async function createTask(title: string) {
  return request('/tasks', { method: 'POST', body: JSON.stringify({ title }) });
}

export async function completeTask(id: string) {
  return request(`/tasks/${id}/complete`, { method: 'PATCH' });
}

export async function deleteTask(id: string) {
  return request(`/tasks/${id}`, { method: 'DELETE' });
}

export async function searchTasks(query: string) {
  return request(`/search?q=${encodeURIComponent(query)}`);
}
