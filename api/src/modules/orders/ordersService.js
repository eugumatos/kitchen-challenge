const { computePriority, scoreBreakdown, minutesWaiting, totalPrepMinutes } = require('./priority');
const { compareQueue } = require('./compareQueue');
const { ACTIONS, ACTIVE_STATUSES, availableActions, nextStatus } = require('./transitions');
const { DomainError, ERROR_CODES } = require('./errors');

function parseOrderId(raw) {
  const id = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isSafeInteger(id) || id <= 0 || (typeof raw === 'string' && !/^\d+$/.test(raw))) {
    throw new DomainError(ERROR_CODES.INVALID_ORDER_ID, 'Order id must be a positive integer', {
      id: raw,
    });
  }
  return id;
}

function resolveStatuses(statusFilter) {
  if (statusFilter === undefined) return ACTIVE_STATUSES;
  if (ACTIVE_STATUSES.includes(statusFilter)) return [statusFilter];
  throw new DomainError(
    ERROR_CODES.INVALID_STATUS_FILTER,
    `status must be one of: ${ACTIVE_STATUSES.join(', ')}`,
    { status: statusFilter, allowed: ACTIVE_STATUSES },
  );
}

function createOrdersService({ orderRepository }) {
  async function getQueue({ statusFilter, now }) {
    const statuses = resolveStatuses(statusFilter);
    const orders = await orderRepository.findByStatuses(statuses);
    const entries = orders.map((order) => ({
      ...order,
      score: computePriority(order, now),
      breakdown: scoreBreakdown(order, now),
      minutes_waiting: minutesWaiting(order, now),
      total_prep_minutes: totalPrepMinutes(order),
      available_actions: availableActions(order.status),
    }));
    return { generated_at: now, orders: entries.sort(compareQueue) };
  }

  async function applyAction({ orderId, action }) {
    const id = parseOrderId(orderId);
    if (!Object.hasOwn(ACTIONS, action)) {
      throw new DomainError(ERROR_CODES.UNKNOWN_ACTION, `Unknown action: ${action}`, { action });
    }

    const order = await orderRepository.findById(id);
    if (!order) {
      throw new DomainError(ERROR_CODES.ORDER_NOT_FOUND, `Order ${id} not found`, { id });
    }

    const to = nextStatus(order.status, action);
    const won = await orderRepository.updateStatusIf(id, order.status, to);
    if (!won) {
      // Another request moved the order between our read and write. Report against the
      // status it has now, so the caller sees why the action no longer applies.
      const current = await orderRepository.findById(id);
      if (!current) {
        throw new DomainError(ERROR_CODES.ORDER_NOT_FOUND, `Order ${id} not found`, { id });
      }
      throw new DomainError(
        ERROR_CODES.INVALID_TRANSITION,
        `Cannot ${action} an order that is ${current.status}`,
        { status: current.status, action },
      );
    }

    const updated = await orderRepository.findById(id);
    return { ...updated, available_actions: availableActions(updated.status) };
  }

  return { getQueue, applyAction };
}

module.exports = { createOrdersService };
