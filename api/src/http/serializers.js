const toIso = (value) => (value == null ? null : new Date(value).toISOString());

const itemsSummary = (items) => items.map((i) => `${i.quantity}x ${i.name}`).join(', ');

function serializeItem(item) {
  return {
    menu_item_id: item.menu_item_id,
    name: item.name,
    category: item.category,
    prep_time_minutes: item.prep_time_minutes,
    quantity: item.quantity,
  };
}

function serializeOrder(order) {
  return {
    id: order.id,
    customer_name: order.customer_name,
    type: order.type,
    is_vip: order.is_vip,
    status: order.status,
    placed_at: toIso(order.placed_at),
    promised_at: toIso(order.promised_at),
    items: order.items.map(serializeItem),
    items_summary: itemsSummary(order.items),
    available_actions: order.available_actions,
  };
}

function serializeQueueEntry(entry) {
  return {
    ...serializeOrder(entry),
    score: entry.score,
    score_breakdown: entry.breakdown,
    minutes_waiting: entry.minutes_waiting,
    total_prep_minutes: entry.total_prep_minutes,
  };
}

function serializeQueue({ generated_at, orders }) {
  return { generated_at: toIso(generated_at), orders: orders.map(serializeQueueEntry) };
}

module.exports = { serializeQueue, serializeOrder, itemsSummary };
