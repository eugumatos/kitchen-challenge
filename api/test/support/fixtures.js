const NOW = new Date('2026-06-15T12:00:00Z');
const at = (minutesFromNow) => new Date(NOW.getTime() + minutesFromNow * 60 * 1000);

const order = (overrides) => ({
  customer_name: 'Test',
  type: 'dine_in',
  is_vip: false,
  status: 'received',
  placed_at: at(-10),
  promised_at: null,
  items: [{ menu_item_id: 1, name: 'Caesar Salad', category: 'starter', prep_time_minutes: 10, quantity: 1 }],
  ...overrides,
});

// One order per status, plus the assignment's worked examples A (id 1) and B (id 2).
const fixtureOrders = () => [
  order({
    id: 1, customer_name: 'Example A', type: 'dine_in', placed_at: at(-35),
    items: [
      { menu_item_id: 1, name: 'Grilled Salmon', category: 'main_course', prep_time_minutes: 20, quantity: 2 },
      { menu_item_id: 2, name: 'Caesar Salad', category: 'starter', prep_time_minutes: 10, quantity: 1 },
    ],
  }),
  order({
    id: 2, customer_name: 'Example B', type: 'delivery', is_vip: true, status: 'preparing',
    placed_at: at(-10), promised_at: at(20),
    items: [{ menu_item_id: 3, name: 'Margherita Pizza', category: 'main_course', prep_time_minutes: 12, quantity: 1 }],
  }),
  order({ id: 3, customer_name: 'Ready', status: 'ready' }),
  order({ id: 4, customer_name: 'Picked up', status: 'picked_up' }),
  order({ id: 5, customer_name: 'Cancelled', status: 'cancelled' }),
];

module.exports = { NOW, at, order, fixtureOrders };
