const {
  ACTIONS,
  STATUSES,
  ACTIVE_STATUSES,
  availableActions,
  nextStatus,
} = require('../../../src/modules/orders/transitions');
const { DomainError, ERROR_CODES } = require('../../../src/modules/orders/errors');

const LEGAL = [
  ['received', 'start', 'preparing'],
  ['received', 'cancel', 'cancelled'],
  ['preparing', 'ready', 'ready'],
  ['ready', 'pickup', 'picked_up'],
];

const ALL = STATUSES.flatMap((s) => Object.keys(ACTIONS).map((a) => [s, a]));
const isLegal = (s, a) => LEGAL.some(([ls, la]) => ls === s && la === a);
const ILLEGAL = ALL.filter(([s, a]) => !isLegal(s, a));

describe('transition matrix', () => {
  test('5 statuses x 4 actions = 20 combinations: 4 legal, 16 illegal', () => {
    expect(STATUSES).toHaveLength(5);
    expect(Object.keys(ACTIONS).sort()).toEqual(['cancel', 'pickup', 'ready', 'start']);
    expect(ALL).toHaveLength(20);
    expect(ILLEGAL).toHaveLength(16);
  });

  test.each(LEGAL)('%s + %s -> %s', (status, action, to) => {
    expect(nextStatus(status, action)).toBe(to);
  });

  test.each(ILLEGAL)('%s + %s is rejected with INVALID_TRANSITION', (status, action) => {
    expect(() => nextStatus(status, action)).toThrow(DomainError);
    try {
      nextStatus(status, action);
    } catch (err) {
      expect(err.code).toBe(ERROR_CODES.INVALID_TRANSITION);
      expect(err.details).toEqual({ status, action });
    }
  });

  test('unknown action is rejected with UNKNOWN_ACTION', () => {
    expect(() => nextStatus('received', 'teleport')).toThrow(
      expect.objectContaining({ code: ERROR_CODES.UNKNOWN_ACTION }),
    );
  });
});

describe('illegal transitions named in the assignment', () => {
  const rejects = (status, action) =>
    expect(() => nextStatus(status, action)).toThrow(
      expect.objectContaining({ code: ERROR_CODES.INVALID_TRANSITION }),
    );

  test('skipping a step: received cannot jump to ready', () => rejects('received', 'ready'));
  test('repeating a transition: starting an order already preparing', () =>
    rejects('preparing', 'start'));
  test('from terminal statuses', () => {
    Object.keys(ACTIONS).forEach((action) => {
      rejects('picked_up', action);
      rejects('cancelled', action);
    });
  });
});

describe('availableActions', () => {
  test.each([
    ['received', ['start', 'cancel']],
    ['preparing', ['ready']],
    ['ready', ['pickup']],
    ['picked_up', []],
    ['cancelled', []],
  ])('%s -> %p', (status, actions) => {
    expect(availableActions(status)).toEqual(actions);
  });
});

describe('ACTIVE_STATUSES', () => {
  test('are received and preparing only (ready, picked_up, cancelled stay off the queue)', () => {
    expect(ACTIVE_STATUSES).toEqual(['received', 'preparing']);
  });
});
