// Thin typed client for the inference.club OpenAI-compatible API.
// One place that owns the contract with the backend.

import { getSettings } from './settings';

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const { baseUrl, token } = await getSettings();
  if (!token) throw new Error('No API token set.');
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const base = baseUrl.replace(/\/+$/, '');
  return fetch(`${base}${path}`, { ...init, headers });
}

export interface ModelInfo {
  id: string;
}

export async function listModels(): Promise<string[]> {
  const res = await apiFetch('/v1/models');
  if (!res.ok) throw new Error(`GET /v1/models → ${res.status}`);
  const data = await res.json();
  const rows: ModelInfo[] = data?.data ?? [];
  return rows.map((m) => m.id).filter(Boolean);
}

// Verify the token + base URL by listing models. Used during onboarding.
export async function verifyConnection(): Promise<{
  ok: boolean;
  models?: string[];
  error?: string;
}> {
  try {
    const models = await listModels();
    return { ok: true, models };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
