const { COMPARATORS, compareQueue } = require('../../../src/modules/orders/compareQueue');

const at = (iso) => new Date(iso);
const base = {
  score: 50,
  promised_at: at('2026-01-15T12:30:00Z'),
  placed_at: at('2026-01-15T11:00:00Z'),
  id: 10,
};
const ids = (list) => list.map((o) => o.id);

describe('compareQueue', () => {
  test('comparators are an ordered list', () => {
    expect(COMPARATORS.map((c) => c.name)).toEqual([
      'byScoreDesc',
      'byPromisedAtAscNullsLast',
      'byPlacedAtAsc',
      'byIdAsc',
    ]);
  });

  test('1. higher score first', () => {
    const a = { ...base, id: 1, score: 40 };
    const b = { ...base, id: 2, score: 60 };
    expect(ids([a, b].sort(compareQueue))).toEqual([2, 1]);
  });

  test('2. equal score: earlier promised_at first', () => {
    const a = { ...base, id: 1, promised_at: at('2026-01-15T12:45:00Z') };
    const b = { ...base, id: 2, promised_at: at('2026-01-15T12:15:00Z') };
    expect(ids([a, b].sort(compareQueue))).toEqual([2, 1]);
  });

  test('2. equal score: null promised_at sorts last', () => {
    const a = { ...base, id: 1, promised_at: null };
    const b = { ...base, id: 2, promised_at: at('2026-01-15T23:00:00Z') };
    expect(ids([a, b].sort(compareQueue))).toEqual([2, 1]);
  });

  test('3. equal score and promise: earlier placed_at first', () => {
    const a = { ...base, id: 1, placed_at: at('2026-01-15T11:30:00Z') };
    const b = { ...base, id: 2, placed_at: at('2026-01-15T11:10:00Z') };
    expect(ids([a, b].sort(compareQueue))).toEqual([2, 1]);
  });

  test('3. both promises null: falls through to placed_at', () => {
    const a = { ...base, id: 1, promised_at: null, placed_at: at('2026-01-15T11:30:00Z') };
    const b = { ...base, id: 2, promised_at: null, placed_at: at('2026-01-15T11:10:00Z') };
    expect(ids([a, b].sort(compareQueue))).toEqual([2, 1]);
  });

  test('4. everything equal: lower id first', () => {
    const a = { ...base, id: 7 };
    const b = { ...base, id: 3 };
    expect(ids([a, b].sort(compareQueue))).toEqual([3, 7]);
  });

  test('full tie-break sequence on one list', () => {
    const list = [
      { ...base, id: 6 }, // ties with 5 except id
      { ...base, id: 5 },
      { ...base, id: 4, placed_at: at('2026-01-15T10:00:00Z') },
      { ...base, id: 3, promised_at: null },
      { ...base, id: 2, promised_at: at('2026-01-15T12:10:00Z') },
      { ...base, id: 1, score: 70 },
    ];
    expect(ids(list.sort(compareQueue))).toEqual([1, 2, 4, 5, 6, 3]);
  });
});
