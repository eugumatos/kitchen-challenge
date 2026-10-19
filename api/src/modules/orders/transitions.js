const { DomainError, ERROR_CODES } = require('./errors');

const STATUSES = Object.freeze(['received', 'preparing', 'ready', 'picked_up', 'cancelled']);

const ACTIONS = Object.freeze({
  start: Object.freeze({ from: Object.freeze(['received']), to: 'preparing' }),
  cancel: Object.freeze({ from: Object.freeze(['received']), to: 'cancelled' }),
  ready: Object.freeze({ from: Object.freeze(['preparing']), to: 'ready' }),
  pickup: Object.freeze({ from: Object.freeze(['ready']), to: 'picked_up' }),
});

// Statuses shown in the default kitchen queue. `ready` orders wait for pickup off-queue.
const ACTIVE_STATUSES = Object.freeze(['received', 'preparing']);

function availableActions(status) {
  return Object.keys(ACTIONS).filter((action) => ACTIONS[action].from.includes(status));
}

function nextStatus(status, action) {
  if (!Object.hasOwn(ACTIONS, action)) {
    throw new DomainError(ERROR_CODES.UNKNOWN_ACTION, `Unknown action: ${action}`, { action });
  }
  const rule = ACTIONS[action];
  if (!rule.from.includes(status)) {
    throw new DomainError(
      ERROR_CODES.INVALID_TRANSITION,
      `Cannot ${action} an order that is ${status}`,
      { status, action },
    );
  }
  return rule.to;
}

module.exports = { STATUSES, ACTIONS, ACTIVE_STATUSES, availableActions, nextStatus };
