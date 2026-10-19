const { PRIORITY_RULES, MINUTE_MS } = require('./priorityRules');
const { DomainError, ERROR_CODES } = require('./errors');

const toMs = (value) => new Date(value).getTime();

const stepped = (minutes, { pointsPerStep, stepMinutes, cap }) =>
  Math.min(Math.floor(minutes / stepMinutes) * pointsPerStep, cap);

function minutesWaiting(order, now) {
  const elapsedMs = toMs(now) - toMs(order.placed_at);
  return Math.max(0, Math.floor(elapsedMs / MINUTE_MS));
}

function typePoints(order, rules = PRIORITY_RULES) {
  if (!Object.hasOwn(rules.typePoints, order.type)) {
    throw new DomainError(ERROR_CODES.UNKNOWN_ORDER_TYPE, `Unknown order type: ${order.type}`, {
      type: order.type,
    });
  }
  return rules.typePoints[order.type];
}

function vipPoints(order, rules = PRIORITY_RULES) {
  return order.is_vip ? rules.vipPoints : 0;
}

function waitingPoints(order, now, rules = PRIORITY_RULES) {
  return stepped(minutesWaiting(order, now), rules.waiting);
}

function totalPrepMinutes(order) {
  return (order.items ?? []).reduce(
    (sum, item) => sum + item.prep_time_minutes * item.quantity,
    0,
  );
}

function complexityPoints(order, rules = PRIORITY_RULES) {
  return stepped(totalPrepMinutes(order), rules.complexity);
}

function promisePoints(order, now, rules = PRIORITY_RULES) {
  if (order.promised_at == null) return 0;
  const remainingMs = toMs(order.promised_at) - toMs(now);
  const bucket = rules.promiseBuckets.find((b) => remainingMs <= b.maxMinutes * MINUTE_MS);
  return bucket ? bucket.points : 0;
}

function scoreBreakdown(order, now, rules = PRIORITY_RULES) {
  return {
    type: typePoints(order, rules),
    vip: vipPoints(order, rules),
    waiting: waitingPoints(order, now, rules),
    complexity: complexityPoints(order, rules),
    promise: promisePoints(order, now, rules),
  };
}

function computePriority(order, now, rules = PRIORITY_RULES) {
  const parts = scoreBreakdown(order, now, rules);
  return Object.values(parts).reduce((sum, points) => sum + points, 0);
}

module.exports = {
  computePriority,
  scoreBreakdown,
  minutesWaiting,
  totalPrepMinutes,
  typePoints,
  vipPoints,
  waitingPoints,
  complexityPoints,
  promisePoints,
};
