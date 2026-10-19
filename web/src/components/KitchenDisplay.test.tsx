import { describe, expect, test } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockApi, queue, queueOrder, renderApp } from '../test/renderApp';

const rowFor = (name: string) => screen.getByRole('listitem', { name: new RegExp(`^${name},`) });

describe('KitchenDisplay contract with the API', () => {
  test('an empty queue renders the empty state', async () => {
    mockApi((url) => (url.startsWith('/api/orders/queue') ? { status: 200, body: queue([]) } : undefined));
    renderApp();

    expect(await screen.findByText('No active orders')).toBeInTheDocument();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  test('Cancel is shown only when available_actions includes it', async () => {
    mockApi(() => ({
      status: 200,
      body: queue([
        queueOrder({ id: 1, customer_name: 'Ana', status: 'received', available_actions: ['start', 'cancel'], score: 70 }),
        queueOrder({ id: 2, customer_name: 'Carla', status: 'preparing', available_actions: ['ready'], score: 60 }),
        // Same status as Ana, but the API withholds cancel: the UI must not infer it from status.
        queueOrder({ id: 3, customer_name: 'Diego', status: 'received', available_actions: ['start'], score: 50 }),
      ]),
    }));
    renderApp();

    const ana = await screen.findByRole('listitem', { name: /^Ana,/ });
    expect(within(ana).getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(within(rowFor('Carla')).queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
    expect(within(rowFor('Diego')).queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();

    // One button per available action, labelled for that action.
    expect(within(ana).getAllByRole('button').map((b) => b.textContent)).toEqual(['Start', 'Cancel']);
    expect(within(rowFor('Carla')).getAllByRole('button').map((b) => b.textContent)).toEqual(['Mark ready']);
  });

  test('rows stay in API order even when scores are out of order', async () => {
    // Deliberately unsorted by score: client-side sorting would produce Bruno, Elisa, Ana.
    mockApi(() => ({
      status: 200,
      body: queue([
        queueOrder({ id: 11, customer_name: 'Ana', score: 30 }),
        queueOrder({ id: 12, customer_name: 'Bruno', score: 90 }),
        queueOrder({ id: 13, customer_name: 'Elisa', score: 60 }),
      ]),
    }));
    renderApp();

    await screen.findByRole('listitem', { name: /^Ana,/ });
    const names = screen.getAllByRole('listitem').map((row) => row.getAttribute('aria-label')?.split(',')[0]);
    expect(names).toEqual(['Ana', 'Bruno', 'Elisa']);
    // The first row from the API is next up, regardless of its score.
    expect(within(rowFor('Ana')).getByText('next up')).toBeInTheDocument();
    expect(within(rowFor('Ana')).getByText('30')).toBeInTheDocument();
  });

  test('a 409 INVALID_TRANSITION from an action is shown on screen', async () => {
    const user = userEvent.setup();
    const fetchMock = mockApi((url, init) => {
      if (init?.method === 'POST' && url === '/api/orders/1/start') {
        return {
          status: 409,
          body: {
            error: {
              code: 'INVALID_TRANSITION',
              message: 'Cannot start an order that is cancelled',
              details: { status: 'cancelled', action: 'start' },
            },
          },
        };
      }
      if (url.startsWith('/api/orders/queue')) {
        return { status: 200, body: queue([queueOrder({ id: 1, customer_name: 'Gabi' })]) };
      }
      return undefined;
    });
    renderApp();

    const gabi = await screen.findByRole('listitem', { name: /^Gabi,/ });
    await user.click(within(gabi).getByRole('button', { name: 'Start' }));

    const alert = await screen.findByRole('alert');
    expect(within(alert).getByText('That action no longer applies')).toBeInTheDocument();
    expect(within(alert).getByText('Cannot start an order that is cancelled')).toBeInTheDocument();
    expect(within(alert).getByText('INVALID_TRANSITION')).toBeInTheDocument();

    // The UI refetches after the failed action so it reflects the server's current state.
    await waitFor(() =>
      expect(fetchMock.mock.calls.filter(([u]) => String(u).startsWith('/api/orders/queue'))).toHaveLength(2),
    );
  });
});
