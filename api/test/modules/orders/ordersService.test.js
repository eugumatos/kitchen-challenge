const { createOrdersService } = require('../../../src/modules/orders/ordersService');
const { ERROR_CODES } = require('../../../src/modules/orders/errors');
const { createInMemoryOrderRepository } = require('../../support/inMemoryOrderRepository');
const { NOW, fixtureOrders } = require('../../support/fixtures');

const setup = (orders = fixtureOrders()) => {
  const orderRepository = createInMemoryOrderRepository(orders);
  return { orderRepository, service: createOrdersService({ orderRepository }) };
};

const rejectsWith = (promise, code) => expect(promise).rejects.toMatchObject({ code });

describe('getQueue', () => {
  test('default queue holds only received and preparing orders', async () => {
    const { service } = setup();
    const { orders } = await service.getQueue({ now: NOW });
    expect(orders.map((o) => o.status).sort()).toEqual(['preparing', 'received']);
  });

  test('cancelled, picked_up and ready orders do not appear in the default queue', async () => {
    const { service } = setup();
    const { orders } = await service.getQueue({ now: NOW });
    const ids = orders.map((o) => o.id);
    expect(ids).not.toContain(3);
    expect(ids).not.toContain(4);
    expect(ids).not.toContain(5);
  });

  test('sorted by score then tie-break, with score, breakdown and actions attached', async () => {
    const { service } = setup();
    const { generated_at, orders } = await service.getQueue({ now: NOW });
    expect(generated_at).toBe(NOW);
    expect(orders.map((o) => o.id)).toEqual([2, 1]); // both 60, B has promised_at
    expect(orders[0]).toMatchObject({
      score: 60,
      breakdown: { type: 10, vip: 20, waiting: 5, promise: 25, complexity: 0 },
      minutes_waiting: 10,
      total_prep_minutes: 12,
      available_actions: ['ready'],
    });
    expect(orders[1].available_actions).toEqual(['start', 'cancel']);
  });

  test.each(['received', 'preparing'])('statusFilter=%s narrows the queue', async (status) => {
    const { service } = setup();
    const { orders } = await service.getQueue({ statusFilter: status, now: NOW });
    expect(orders).toHaveLength(1);
    expect(orders[0].status).toBe(status);
  });

  test.each(['ready', 'cancelled', 'picked_up', '', 'bogus', ['received', 'preparing']])(
    'statusFilter=%p is rejected with INVALID_STATUS_FILTER',
    async (status) => {
      const { service } = setup();
      await rejectsWith(service.getQueue({ statusFilter: status, now: NOW }), ERROR_CODES.INVALID_STATUS_FILTER);
    },
  );

  test('empty queue returns an empty list', async () => {
    const { service } = setup([]);
    expect((await service.getQueue({ now: NOW })).orders).toEqual([]);
  });
});

describe('applyAction', () => {
  test.each([
    [1, 'start', 'preparing'],
    [1, 'cancel', 'cancelled'],
    [2, 'ready', 'ready'],
    [3, 'pickup', 'picked_up'],
  ])('order %p + %s -> %s is persisted', async (id, action, to) => {
    const { service, orderRepository } = setup();
    const result = await service.applyAction({ orderId: String(id), action });
    expect(result.status).toBe(to);
    expect(orderRepository.rows.get(id).status).toBe(to);
  });

  test('starting an order that is already preparing is INVALID_TRANSITION, not a no-op', async () => {
    const { service, orderRepository } = setup();
    await rejectsWith(service.applyAction({ orderId: '2', action: 'start' }), ERROR_CODES.INVALID_TRANSITION);
    expect(orderRepository.rows.get(2).status).toBe('preparing');
  });

  test('a cancelled order disappears from the default queue', async () => {
    const { service } = setup();
    await service.applyAction({ orderId: '1', action: 'cancel' });
    const { orders } = await service.getQueue({ now: NOW });
    expect(orders.map((o) => o.id)).not.toContain(1);
  });

  test.each(['abc', '0', '-1', '1.5', '1e3', ''])('orderId %p -> INVALID_ORDER_ID', async (id) => {
    const { service } = setup();
    await rejectsWith(service.applyAction({ orderId: id, action: 'start' }), ERROR_CODES.INVALID_ORDER_ID);
  });

  test('unknown action -> UNKNOWN_ACTION (checked before touching the repository)', async () => {
    const { service, orderRepository } = setup();
    const spy = jest.spyOn(orderRepository, 'findById');
    await rejectsWith(service.applyAction({ orderId: '1', action: 'teleport' }), ERROR_CODES.UNKNOWN_ACTION);
    expect(spy).not.toHaveBeenCalled();
  });

  test('missing order -> ORDER_NOT_FOUND', async () => {
    const { service } = setup();
    await rejectsWith(service.applyAction({ orderId: '999', action: 'start' }), ERROR_CODES.ORDER_NOT_FOUND);
  });

  test('lost race: status changed between read and write -> INVALID_TRANSITION with current status', async () => {
    const { service, orderRepository } = setup();
    const realFind = orderRepository.findById;
    // First read sees `received`; a concurrent request cancels before our conditional write.
    jest.spyOn(orderRepository, 'findById').mockImplementationOnce(async (id) => {
      const snapshot = await realFind(id);
      orderRepository.rows.get(id).status = 'cancelled';
      return snapshot;
    });
    await expect(service.applyAction({ orderId: '1', action: 'start' })).rejects.toMatchObject({
      code: ERROR_CODES.INVALID_TRANSITION,
      details: { status: 'cancelled', action: 'start' },
    });
    expect(orderRepository.rows.get(1).status).toBe('cancelled');
  });
});
