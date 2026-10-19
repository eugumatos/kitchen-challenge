const MINUTE_MS = 60 * 1000;

const TYPE_POINTS = Object.freeze({
  dine_in: 30,
  takeout: 20,
  delivery: 10,
});

const PRIORITY_RULES = Object.freeze({
  typePoints: TYPE_POINTS,
  vipPoints: 20,
  waiting: Object.freeze({ pointsPerStep: 5, stepMinutes: 10, cap: 40 }),
  complexity: Object.freeze({ pointsPerStep: 5, stepMinutes: 15, cap: 20 }),
  // Evaluated in order against the exact time remaining until promised_at.
  // Overdue orders have negative time remaining and fall into the first bucket.
  promiseBuckets: Object.freeze([
    Object.freeze({ maxMinutes: 30, points: 25 }),
    Object.freeze({ maxMinutes: 60, points: 15 }),
  ]),
});

module.exports = { PRIORITY_RULES, MINUTE_MS };
