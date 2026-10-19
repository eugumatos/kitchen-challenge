import type { QueueFilter } from '../api/types';

const COPY: Record<QueueFilter, { title: string; hint: string }> = {
  all: {
    title: 'No active orders',
    hint: 'New orders appear here as soon as they are placed.',
  },
  received: {
    title: 'No orders waiting to start',
    hint: 'Everything received is already being prepared.',
  },
  preparing: {
    title: 'Nothing is being prepared',
    hint: 'Start a received order and it will show up here.',
  },
};

export function EmptyState({ filter }: { filter: QueueFilter }) {
  const { title, hint } = COPY[filter];
  return (
    <div className="empty" role="status">
      <p className="empty__title">{title}</p>
      <p className="empty__hint">{hint}</p>
    </div>
  );
}
