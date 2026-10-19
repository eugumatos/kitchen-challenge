// Each comparator receives queue entries shaped as { ...order, score }.
const toMs = (value) => new Date(value).getTime();

function byScoreDesc(a, b) {
  return b.score - a.score;
}

function byPromisedAtAscNullsLast(a, b) {
  const aNull = a.promised_at == null;
  const bNull = b.promised_at == null;
  if (aNull && bNull) return 0;
  if (aNull) return 1;
  if (bNull) return -1;
  return toMs(a.promised_at) - toMs(b.promised_at);
}

function byPlacedAtAsc(a, b) {
  return toMs(a.placed_at) - toMs(b.placed_at);
}

function byIdAsc(a, b) {
  if (typeof a.id === 'number' && typeof b.id === 'number') return a.id - b.id;
  return String(a.id).localeCompare(String(b.id));
}

const COMPARATORS = Object.freeze([byScoreDesc, byPromisedAtAscNullsLast, byPlacedAtAsc, byIdAsc]);

function compareQueue(a, b) {
  for (const comparator of COMPARATORS) {
    const result = comparator(a, b);
    if (result !== 0) return result;
  }
  return 0;
}

module.exports = { COMPARATORS, compareQueue };
