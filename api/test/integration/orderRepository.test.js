// Runs against kitchen_queue_test (NODE_ENV=test). Use: npm run test:integration -w api
const { sequelize, MenuItem, Order, OrderItem } = require('../../src/schema/models');
const orderRepository = require('../../src/repositories/orderRepository');

let orderId;

beforeEach(async () => {
  await sequelize.query('TRUNCATE order_items, orders, menu_items RESTART IDENTITY CASCADE');
  const salmon = await MenuItem.create({ name: 'Grilled Salmon', category: 'main_course', prep_time_minutes: 20 });
  const order = await Order.create({
    customer_name: 'Integration',
    type: 'dine_in',
    status: 'received',
    placed_at: new Date('2026-06-15T11:25:00Z'),
  });
  await OrderItem.create({ order_id: order.id, menu_item_id: salmon.id, quantity: 2 });
  orderId = order.id;
});

afterAll(() => sequelize.close());

test('findById returns a plain domain object with items, not a Sequelize instance', async () => {
  const order = await orderRepository.findById(orderId);
  expect(order.constructor).toBe(Object);
  expect(order).toEqual({
    id: orderId,
    customer_name: 'Integration',
    type: 'dine_in',
    is_vip: false,
    status: 'received',
    placed_at: new Date('2026-06-15T11:25:00Z'),
    promised_at: null,
    items: [{ menu_item_id: 1, name: 'Grilled Salmon', category: 'main_course', prep_time_minutes: 20, quantity: 2 }],
  });
});

test('findByStatuses filters by status', async () => {
  expect(await orderRepository.findByStatuses(['received'])).toHaveLength(1);
  expect(await orderRepository.findByStatuses(['ready'])).toHaveLength(0);
});

test('updateStatusIf only updates when the current status still matches', async () => {
  expect(await orderRepository.updateStatusIf(orderId, 'received', 'preparing')).toBe(true);
  expect(await orderRepository.updateStatusIf(orderId, 'received', 'cancelled')).toBe(false);
  expect((await orderRepository.findById(orderId)).status).toBe('preparing');
});

test('two concurrent conditional updates: exactly one wins', async () => {
  const results = await Promise.all([
    orderRepository.updateStatusIf(orderId, 'received', 'preparing'),
    orderRepository.updateStatusIf(orderId, 'received', 'cancelled'),
  ]);
  expect(results.filter(Boolean)).toHaveLength(1);
});

test('CHECK constraint rejects a status outside the allowed list', async () => {
  await expect(
    sequelize.query(`UPDATE orders SET status = 'teleported' WHERE id = ${orderId}`),
  ).rejects.toThrow(/orders_status_check/);
});
