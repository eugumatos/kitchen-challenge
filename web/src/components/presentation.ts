// Presentation-only helpers: labels and time formatting. No ranking or status rules here.

export const ACTION_LABELS: Record<string, string> = {
  start: 'Start',
  ready: 'Mark ready',
  pickup: 'Picked up',
  cancel: 'Cancel',
};

export const TYPE_LABELS: Record<string, string> = {
  dine_in: 'dine-in',
  takeout: 'takeout',
  delivery: 'delivery',
};

export const STATUS_LABELS: Record<string, string> = {
  received: 'received',
  preparing: 'preparing',
  ready: 'ready',
  picked_up: 'picked up',
  cancelled: 'cancelled',
};

export const ERROR_TITLES: Record<string, string> = {
  INVALID_TRANSITION: 'That action no longer applies',
  ORDER_NOT_FOUND: 'Order not found',
  UNKNOWN_ACTION: 'Action not supported',
  INVALID_ORDER_ID: 'Invalid order id',
  INVALID_STATUS_FILTER: 'Invalid filter',
  NETWORK_ERROR: 'Kitchen API unreachable',
  INTERNAL_ERROR: 'The kitchen API hit an unexpected error',
};

export const humanize = (value: string) => value.replace(/_/g, ' ');

export function formatDuration(totalMinutes: number): string {
  const minutes = Math.max(0, Math.round(totalMinutes));
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

const clockFormat = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});
const clockWithSeconds = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

export const formatClock = (iso: string) => clockFormat.format(new Date(iso));
export const formatClockSeconds = (iso: string) => clockWithSeconds.format(new Date(iso));

// Lateness is judged against the API's generated_at, never the browser clock,
// so every row agrees with the snapshot the scores were computed from.
export function promiseStatus(promisedAt: string | null, generatedAt: string) {
  if (!promisedAt) return null;
  const diffMinutes = (Date.parse(promisedAt) - Date.parse(generatedAt)) / 60000;
  return {
    late: diffMinutes < 0,
    minutes: Math.abs(diffMinutes),
    clock: formatClock(promisedAt),
  };
}
