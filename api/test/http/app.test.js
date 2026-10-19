const request = require('supertest');
const { createApp } = require('../../src/app');
const { createOrdersService } = require('../../src/modules/orders/ordersService');
const { createInMemoryOrderRepository } = require('../support/inMemoryOrderRepository');
const { NOW, fixtureOrders } = require('../support/fixtures');

const clock = () => NOW;
const makeApp = () =>
  createApp({
    ordersService: createOrdersService({ orderRepository: createInMemoryOrderRepository(fixtureOrders()) }),
    clock,
  });

const expectError = (res, status, code) => {
  expect(res.status).toBe(status);
  expect(res.body.error.code).toBe(code);
  expect(typeof res.body.error.message).toBe('string');
};

describe('GET /orders/queue', () => {
  test('returns generated_at from the injected clock and serialized orders', async () => {
    const res = await request(makeApp()).get('/orders/queue');
    expect(res.status).toBe(200);
    expect(res.body.generated_at).toBe('2026-06-15T12:00:00.000Z');
    expect(res.body.orders.map((o) => o.id)).toEqual([2, 1]);
    expect(res.body.orders[1]).toEqual({
      id: 1,
      customer_name: 'Example A',
      type: 'dine_in',
      is_vip: false,
      status: 'received',
      placed_at: '2026-06-15T11:25:00.000Z',
      promised_at: null,
      items: [
        { menu_item_id: 1, name: 'Grilled Salmon', category: 'main_course', prep_time_minutes: 20, quantity: 2 },
        { menu_item_id: 2, name: 'Caesar Salad', category: 'starter', prep_time_minutes: 10, quantity: 1 },
      ],
      items_summary: '2x Grilled Salmon, 1x Caesar Salad',
      available_actions: ['start', 'cancel'],
      score: 60,
      score_breakdown: { type: 30, vip: 0, waiting: 15, promise: 0, complexity: 15 },
      minutes_waiting: 35,
      total_prep_minutes: 50,
    });
  });

  test('?status=preparing filters', async () => {
    const res = await request(makeApp()).get('/orders/queue?status=preparing');
    expect(res.status).toBe(200);
    expect(res.body.orders.map((o) => o.id)).toEqual([2]);
  });

  test('?status=ready -> 400 INVALID_STATUS_FILTER', async () => {
    expectError(await request(makeApp()).get('/orders/queue?status=ready'), 400, 'INVALID_STATUS_FILTER');
  });

  test('repeated ?status -> 400 INVALID_STATUS_FILTER', async () => {
    expectError(
      await request(makeApp()).get('/orders/queue?status=received&status=preparing'),
      400,
      'INVALID_STATUS_FILTER',
    );
  });
});

describe('POST /orders/:id/:action', () => {
  test('legal transition -> 200 with the updated order', async () => {
    const res = await request(makeApp()).post('/orders/1/start');
    expect(res.status).toBe(200);
    expect(res.body.order).toMatchObject({ id: 1, status: 'preparing', available_actions: ['ready'] });
  });

  test('illegal transition -> 409 INVALID_TRANSITION', async () => {
    const res = await request(makeApp()).post('/orders/2/start');
    expectError(res, 409, 'INVALID_TRANSITION');
    expect(res.body.error.details).toEqual({ status: 'preparing', action: 'start' });
  });

  test('missing order -> 404 ORDER_NOT_FOUND', async () => {
    expectError(await request(makeApp()).post('/orders/999/start'), 404, 'ORDER_NOT_FOUND');
  });

  test('unknown action -> 404 UNKNOWN_ACTION', async () => {
    expectError(await request(makeApp()).post('/orders/1/teleport'), 404, 'UNKNOWN_ACTION');
  });

  test('bad id -> 400 INVALID_ORDER_ID', async () => {
    expectError(await request(makeApp()).post('/orders/abc/start'), 400, 'INVALID_ORDER_ID');
  });

  test('malformed JSON body -> 400 INVALID_JSON', async () => {
    const res = await request(makeApp())
      .post('/orders/1/start')
      .set('Content-Type', 'application/json')
      .send('{"oops":');
    expectError(res, 400, 'INVALID_JSON');
  });
});

describe('fallbacks', () => {
  test('unknown route -> 404 ROUTE_NOT_FOUND', async () => {
    expectError(await request(makeApp()).get('/nope'), 404, 'ROUTE_NOT_FOUND');
  });

  test('unexpected failure -> 500 INTERNAL_ERROR without leaking internals', async () => {
    const failing = {
      getQueue: async () => {
        throw new Error('connection refused: secret-host:5433');
      },
    };
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = await request(createApp({ ordersService: failing, clock })).get('/orders/queue');
    expectError(res, 500, 'INTERNAL_ERROR');
    expect(JSON.stringify(res.body)).not.toContain('secret-host');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
