import type { QueueFilter, QueueOrder, QueueResponse } from './types';

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, { ...init, headers: { Accept: 'application/json' } });
  } catch {
    throw new ApiError(
      'NETWORK_ERROR',
      'Could not reach the kitchen API. Check that it is running on port 4000.',
      0,
    );
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(
      body?.error?.code ?? `HTTP_${res.status}`,
      body?.error?.message ?? res.statusText,
      res.status,
      body?.error?.details,
    );
  }
  return body as T;
}

export function fetchQueue(filter: QueueFilter): Promise<QueueResponse> {
  const query = filter === 'all' ? '' : `?status=${encodeURIComponent(filter)}`;
  return request<QueueResponse>(`/orders/queue${query}`);
}

export function postAction(orderId: number, action: string): Promise<{ order: QueueOrder }> {
  return request(`/orders/${orderId}/${encodeURIComponent(action)}`, { method: 'POST' });
}
