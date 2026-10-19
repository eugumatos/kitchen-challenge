const { Order, OrderItem, MenuItem } = require('../schema/models');

const ORDER_INCLUDE = [
  {
    model: OrderItem,
    as: 'items',
    include: [{ model: MenuItem, as: 'menuItem' }],
  },
];

// Maps a Sequelize instance to the plain domain shape the modules work with.
function toDomain(row) {
  const order = row.get({ plain: true });
  return {
    id: order.id,
    customer_name: order.customer_name,
    type: order.type,
    is_vip: order.is_vip,
    status: order.status,
    placed_at: order.placed_at,
    promised_at: order.promised_at,
    items: (order.items ?? [])
      .slice()
      .sort((a, b) => a.id - b.id)
      .map((item) => ({
        menu_item_id: item.menu_item_id,
        name: item.menuItem.name,
        category: item.menuItem.category,
        prep_time_minutes: item.menuItem.prep_time_minutes,
        quantity: item.quantity,
      })),
  };
}

async function findByStatuses(statuses) {
  const rows = await Order.findAll({ where: { status: statuses }, include: ORDER_INCLUDE });
  return rows.map(toDomain);
}

async function findById(id) {
  const row = await Order.findByPk(id, { include: ORDER_INCLUDE });
  return row ? toDomain(row) : null;
}

// Compare-and-set: only moves the row if its status is still `from`.
// Returns true when this call won; false when another request changed the status first.
async function updateStatusIf(id, from, to) {
  const [affected] = await Order.update({ status: to }, { where: { id, status: from } });
  return affected === 1;
}

module.exports = { findByStatuses, findById, updateStatusIf };
