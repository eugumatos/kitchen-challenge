import { useState } from 'react';
import { IconButton, ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { AnimatePresence } from 'motion/react';
import type { QueueFilter } from '../api/types';
import { REFRESH_MS, useQueue } from '../hooks/useQueue';
import { EmptyState } from './EmptyState';
import { ErrorBanner } from './ErrorBanner';
import { QueueRow } from './QueueRow';
import { formatClockSeconds } from './presentation';

const FILTERS: { value: QueueFilter; label: string }[] = [
  { value: 'all', label: 'All active' },
  { value: 'received', label: 'Received' },
  { value: 'preparing', label: 'Preparing' },
];

export function KitchenDisplay() {
  const [filter, setFilter] = useState<QueueFilter>('all');
  const { data, error, pendingId, exitReasons, refresh, runAction, dismissError } = useQueue(filter);

  const orders = data?.orders ?? [];
  const topScore = orders.reduce((max, o) => Math.max(max, o.score), 0);

  return (
    <main className="kd">
      <header className="kd__header">
        <h1 className="kd__title">
          Orders heading to <span className="kd__accent">the pass</span>
        </h1>
        <p className="kd__meta" aria-live="polite">
          {data
            ? `Ranked by the kitchen API at ${formatClockSeconds(data.generated_at)}. Refreshes every ${REFRESH_MS / 1000}s.`
            : 'Loading the queue…'}
        </p>
      </header>

      <section className="panel" aria-label="Kitchen queue">
        <div className="panel__toolbar">
          <ToggleButtonGroup
            exclusive
            size="small"
            value={filter}
            onChange={(_, value: QueueFilter | null) => value && setFilter(value)}
            aria-label="Filter the queue"
          >
            {FILTERS.map((f) => (
              <ToggleButton key={f.value} value={f.value}>
                {f.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <Tooltip title="Refresh now">
            <IconButton size="small" onClick={refresh} aria-label="Refresh now">
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </div>

        {error && <ErrorBanner error={error} onClose={dismissError} />}

        {orders.length > 0 && (
          <div className="columns" aria-hidden>
            <span />
            <span>order</span>
            <span className="columns__lane">
              <span>priority</span>
              <span className="columns__pass">the pass</span>
            </span>
            <span />
            <span />
          </div>
        )}

        {data && (
          <div role="list" className="rows" key={filter}>
            <AnimatePresence>
              {orders.map((order, index) => (
                <QueueRow
                  key={order.id}
                  order={order}
                  index={index}
                  topScore={topScore}
                  generatedAt={data.generated_at}
                  isNextUp={index === 0}
                  pending={pendingId === order.id}
                  exitReasons={exitReasons}
                  onAction={runAction}
                />
              ))}
            </AnimatePresence>
            {orders.length === 0 && <EmptyState filter={filter} />}
          </div>
        )}
      </section>
    </main>
  );
}
