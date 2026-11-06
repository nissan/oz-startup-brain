import 'server-only';
import { createOzsbClient, type OzsbClient } from '@ozsb/api-client';

/**
 * The only place the backend credential is read. It never leaves this module: it is sent as the
 * X-API-Key header to the fixture API and is not logged, echoed or exposed through NEXT_PUBLIC_.
 */
let client: OzsbClient | null = null;

export class BffConfigError extends Error {}

export function apiClient(): OzsbClient {
  if (client) return client;
  const baseUrl = process.env.OZSB_API_BASE_URL;
  const apiKey = process.env.OZSB_API_KEY;
  if (!baseUrl) throw new BffConfigError('OZSB_API_BASE_URL is not set');
  if (!apiKey) throw new BffConfigError('OZSB_API_KEY is not set');
  client = createOzsbClient({ baseUrl, apiKey, validate: true });
  return client;
}

/** For tests: forget the cached client so a changed environment takes effect. */
export function resetApiClient(): void {
  client = null;
}
