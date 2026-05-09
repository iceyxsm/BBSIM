const BASE = '';

async function request(method: string, path: string, token?: string | null, body?: any) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  return res.json();
}

export const api = {
  get: (path: string, token?: string | null) => request('GET', path, token),
  post: (path: string, body: any, token?: string | null) => request('POST', path, token, body),
  patch: (path: string, body: any, token?: string | null) => request('PATCH', path, token, body),
  delete: (path: string, token?: string | null) => request('DELETE', path, token),
};
