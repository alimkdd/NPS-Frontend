import { clearAdminAuth, getAdminToken } from './auth';
import {
  ApiError,
  type LookupsResponse,
  type PagedResult,
  type SubscriptionFilter,
  type SubscriptionResponse,
  type SubscriptionStats,
  type UnsubscribeAck,
  type UpsertSubscriptionAck,
  type UpsertSubscriptionRequest,
} from './types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://localhost:7287';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'DELETE';
  body?: unknown;
  admin?: boolean;
  signal?: AbortSignal;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, admin = false, signal } = options;

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (admin) {
    const token = await getAdminToken();
    if (!token) {
      throw new ApiError(401, 'Your session has expired. Please sign in again.');
    }
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    throw new ApiError(0, 'Cannot reach the server. Is the API running?');
  }

  // Token expired, revoked, or rejected — clear both auth methods so the UI bounces back to
  // login instead of looping (the login page only auto-redirects while authenticated).
  if (admin && response.status === 401) {
    clearAdminAuth();
  }

  const correlationId = response.headers.get('X-Correlation-Id') ?? undefined;

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : null;

  if (!response.ok) {
    const validationErrors: string[] = Array.isArray(payload?.errors) ? payload.errors : [];
    const message =
      validationErrors[0] ??
      payload?.error ??
      `Request failed with status ${response.status}.`;
    throw new ApiError(response.status, message, validationErrors, correlationId);
  }

  return payload as T;
}

export const api = {
  getLookups: (signal?: AbortSignal) =>
    request<LookupsResponse>('/api/lookups', { signal }),

  upsertSubscription: (req: UpsertSubscriptionRequest) =>
    request<UpsertSubscriptionAck>('/api/subscriptions', {
      method: 'POST',
      body: req,
    }),

  unsubscribe: (email: string) =>
    request<UnsubscribeAck>('/api/subscriptions/unsubscribe', {
      method: 'POST',
      body: { email },
    }),

  listSubscriptions: (filter: SubscriptionFilter, signal?: AbortSignal) => {
    const params = new URLSearchParams();
    if (filter.searchTerm) params.set('searchTerm', filter.searchTerm);
    if (filter.subscriberTypeId !== undefined) params.set('subscriberTypeId', String(filter.subscriberTypeId));
    if (filter.communicationPreferenceId !== undefined) params.set('communicationPreferenceId', String(filter.communicationPreferenceId));
    if (filter.interestId !== undefined) params.set('interestId', String(filter.interestId));
    if (filter.page) params.set('page', String(filter.page));
    if (filter.pageSize) params.set('pageSize', String(filter.pageSize));
    const qs = params.toString();
    return request<PagedResult<SubscriptionResponse>>(
      `/api/admin/subscriptions${qs ? `?${qs}` : ''}`,
      { admin: true, signal },
    );
  },

  getSubscription: (id: string, signal?: AbortSignal) =>
    request<SubscriptionResponse>(`/api/admin/subscriptions/${id}`, {
      admin: true,
      signal,
    }),

  getStats: (signal?: AbortSignal) =>
    request<SubscriptionStats>(`/api/admin/subscriptions/stats`, {
      admin: true,
      signal,
    }),

  deleteSubscription: (id: string) =>
    request<void>(`/api/admin/subscriptions/${id}`, {
      method: 'DELETE',
      admin: true,
    }),
};
