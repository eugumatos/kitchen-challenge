import { render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { MotionConfig } from 'motion/react';
import { vi } from 'vitest';
import { theme } from '../theme/theme';
import { KitchenDisplay } from '../components/KitchenDisplay';
import type { QueueOrder, QueueResponse } from '../api/types';

export const GENERATED_AT = '2026-06-15T12:00:00.000Z';

export function queueOrder(overrides: Partial<QueueOrder>): QueueOrder {
  return {
    id: 1,
    customer_name: 'Test',
    type: 'dine_in',
    is_vip: false,
    status: 'received',
    placed_at: '2026-06-15T11:50:00.000Z',
    promised_at: null,
    items: [],
    items_summary: '1x Caesar Salad',
    available_actions: ['start', 'cancel'],
    score: 30,
    score_breakdown: { type: 30, vip: 0, waiting: 0, promise: 0, complexity: 0 },
    minutes_waiting: 10,
    total_prep_minutes: 10,
    ...overrides,
  };
}

export const queue = (orders: QueueOrder[]): QueueResponse => ({ generated_at: GENERATED_AT, orders });

type Route = (url: string, init?: RequestInit) => { status: number; body: unknown } | undefined;

// Stubs global fetch with a tiny router so tests describe the API responses they need.
export function mockApi(route: Route) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const res = route(url, init);
    if (!res) throw new Error(`Unmocked request: ${init?.method ?? 'GET'} ${url}`);
    return new Response(JSON.stringify(res.body), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

export function renderApp() {
  return render(
    <ThemeProvider theme={theme}>
      <MotionConfig reducedMotion="user">
        <KitchenDisplay />
      </MotionConfig>
    </ThemeProvider>,
  );
}
