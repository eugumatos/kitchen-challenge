const {
  computePriority,
  scoreBreakdown,
  minutesWaiting,
  totalPrepMinutes,
  waitingPoints,
  complexityPoints,
  promisePoints,
  vipPoints,
} = require('../../../src/modules/orders/priority');
const { DomainError } = require('../../../src/modules/orders/errors');
const { compareQueue } = require('../../../src/modules/orders/compareQueue');

const NOW = new Date('2026-01-15T12:00:00.000Z');
const minus = (ms) => new Date(NOW.getTime() - ms);
const plus = (ms) => new Date(NOW.getTime() + ms);
const SEC = 1000;
const MIN = 60 * SEC;

describe('minutesWaiting', () => {
  test('uses whole minutes (9m50s counts as 9)', () => {
    expect(minutesWaiting({ placed_at: minus(9 * MIN + 50 * SEC) }, NOW)).toBe(9);
  });

  test('clamps future placed_at to zero', () => {
    expect(minutesWaiting({ placed_at: plus(5 * MIN) }, NOW)).toBe(0);
  });

  test('accepts ISO strings', () => {
    expect(minutesWaiting({ placed_at: minus(12 * MIN).toISOString() }, NOW)).toBe(12);
  });
});

describe('waitingPoints', () => {
  test.each([
    [0, 0],
    [9 * MIN + 50 * SEC, 0],
    [10 * MIN, 5],
    [25 * MIN, 10],
    [79 * MIN, 35],
    [80 * MIN, 40],
    [300 * MIN, 40],
  ])('waited %pms -> %p points', (waitedMs, points) => {
    expect(waitingPoints({ placed_at: minus(waitedMs) }, NOW)).toBe(points);
  });

  test('cap: never exceeds 40', () => {
    expect(waitingPoints({ placed_at: minus(24 * 60 * MIN) }, NOW)).toBe(40);
  });
});

const prep = (minutes, quantity = 1) => ({ items: [{ prep_time_minutes: minutes, quantity }] });

describe('totalPrepMinutes', () => {
  test('sums prep_time_minutes * quantity across items', () => {
    const order = {
      items: [
        { prep_time_minutes: 20, quantity: 2 },
        { prep_time_minutes: 10, quantity: 1 },
      ],
    };
    expect(totalPrepMinutes(order)).toBe(50);
  });

  test('no items -> 0', () => {
    expect(totalPrepMinutes({ items: [] })).toBe(0);
  });
});

describe('complexityPoints', () => {
  test.each([
    [0, 0],
    [14, 0],
    [15, 5],
    [30, 10],
    [59, 15],
    [60, 20],
    [120, 20],
  ])('%p total prep minutes -> %p points', (minutes, points) => {
    expect(complexityPoints(prep(minutes))).toBe(points);
  });

  test('cap: never exceeds 20', () => {
    expect(complexityPoints(prep(50, 20))).toBe(20);
  });
});

describe('promisePoints (exact time difference)', () => {
  test.each([
    ['overdue', minus(5 * MIN), 25],
    ['due now', NOW, 25],
    ['due in 30:00', plus(30 * MIN), 25],
    ['due in 30:30', plus(30 * MIN + 30 * SEC), 15],
    ['due in 60:00', plus(60 * MIN), 15],
    ['due in 61:00', plus(61 * MIN), 0],
    ['no promise (null)', null, 0],
  ])('%s', (_label, promisedAt, points) => {
    expect(promisePoints({ promised_at: promisedAt }, NOW)).toBe(points);
  });
});

describe('vipPoints', () => {
  test('VIP adds 20, non-VIP adds 0', () => {
    expect(vipPoints({ is_vip: true })).toBe(20);
    expect(vipPoints({ is_vip: false })).toBe(0);
  });
});

describe('computePriority', () => {
  test('rejects unknown order types with a DomainError', () => {
    expect(() => computePriority({ type: 'nope', placed_at: NOW }, NOW)).toThrow(DomainError);
    try {
      computePriority({ type: 'nope', placed_at: NOW }, NOW);
    } catch (err) {
      expect(err.code).toBe('UNKNOWN_ORDER_TYPE');
    }
  });

  test('does not read the clock (Date.now is never called)', () => {
    const spy = jest.spyOn(Date, 'now');
    const order = {
      is_vip: true,
      placed_at: minus(25 * MIN),
      promised_at: plus(10 * MIN),
      items: [{ prep_time_minutes: 15, quantity: 2 }],
    };
    minutesWaiting(order, NOW);
    waitingPoints(order, NOW);
    promisePoints(order, NOW);
    complexityPoints(order);
    vipPoints(order);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe('worked examples (assignment 5.3, now = 2026-06-15T12:00:00Z)', () => {
  const EX_NOW = new Date('2026-06-15T12:00:00Z');
  const exampleA = {
    id: 1,
    type: 'dine_in',
    is_vip: false,
    placed_at: '2026-06-15T11:25:00Z',
    promised_at: null,
    items: [
      { name: 'Grilled Salmon', prep_time_minutes: 20, quantity: 2 },
      { name: 'Caesar Salad', prep_time_minutes: 10, quantity: 1 },
    ],
  };
  const exampleB = {
    id: 2,
    type: 'delivery',
    is_vip: true,
    placed_at: '2026-06-15T11:50:00Z',
    promised_at: '2026-06-15T12:20:00Z',
    items: [{ name: 'Margherita Pizza', prep_time_minutes: 12, quantity: 1 }],
  };

  test('example A scores 60 with the documented breakdown', () => {
    expect(scoreBreakdown(exampleA, EX_NOW)).toEqual({
      type: 30, vip: 0, waiting: 15, promise: 0, complexity: 15,
    });
    expect(computePriority(exampleA, EX_NOW)).toBe(60);
  });

  test('example B scores 60 with the documented breakdown', () => {
    expect(scoreBreakdown(exampleB, EX_NOW)).toEqual({
      type: 10, vip: 20, waiting: 5, promise: 25, complexity: 0,
    });
    expect(computePriority(exampleB, EX_NOW)).toBe(60);
  });

  test('tie at 60 is broken by promised_at: B ranks above A', () => {
    const queue = [exampleA, exampleB]
      .map((o) => ({ ...o, score: computePriority(o, EX_NOW) }))
      .sort(compareQueue);
    expect(queue.map((o) => o.id)).toEqual([2, 1]);
  });
});

describe('lower base-weight type wins on the rest of the formula', () => {
  test('delivery VIP with a tight promise beats a dine_in non-VIP', () => {
    const deliveryVip = {
      id: 1,
      type: 'delivery',
      is_vip: true,
      placed_at: minus(5 * MIN),
      promised_at: plus(15 * MIN),
      items: [{ prep_time_minutes: 10, quantity: 1 }],
    };
    const dineIn = {
      id: 2,
      type: 'dine_in',
      is_vip: false,
      placed_at: minus(5 * MIN),
      promised_at: null,
      items: [{ prep_time_minutes: 10, quantity: 1 }],
    };
    // 10 + 20 + 0 + 25 + 0 = 55  vs  30 + 0 + 0 + 0 + 0 = 30
    expect(computePriority(deliveryVip, NOW)).toBe(55);
    expect(computePriority(dineIn, NOW)).toBe(30);
    const queue = [dineIn, deliveryVip]
      .map((o) => ({ ...o, score: computePriority(o, NOW) }))
      .sort(compareQueue);
    expect(queue.map((o) => o.type)).toEqual(['delivery', 'dine_in']);
  });
});
