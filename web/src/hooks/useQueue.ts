import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, fetchQueue, postAction } from '../api/client';
import type { QueueFilter, QueueOrder, QueueResponse } from '../api/types';

export const REFRESH_MS = 20_000;

// How a row leaves the queue: into the pass (ready), faded out (cancel),
// or simply collapsing (it moved out of the current filter, e.g. started while viewing received).
export type ExitReason = 'pass' | 'cancel' | 'leave';

const EXIT_BY_ACTION: Record<string, ExitReason> = { ready: 'pass', cancel: 'cancel', start: 'leave' };

export interface DisplayError {
  code: string;
  message: string;
  context: 'load' | 'action';
}

const toDisplayError = (err: unknown, context: DisplayError['context']): DisplayError =>
  err instanceof ApiError
    ? { code: err.code, message: err.message, context }
    : { code: 'UNEXPECTED_ERROR', message: String(err), context };

export function useQueue(filter: QueueFilter) {
  const [data, setData] = useState<QueueResponse | null>(null);
  const [error, setError] = useState<DisplayError | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  // Why an order left the queue, so its row can animate the right exit.
  const exitReasons = useRef(new Map<number, ExitReason>());
  const requestSeq = useRef(0);

  const refresh = useCallback(async () => {
    const seq = ++requestSeq.current;
    try {
      const next = await fetchQueue(filter);
      if (seq !== requestSeq.current) return; // a newer request superseded this one
      setData(next);
      setError((prev) => (prev?.context === 'load' ? null : prev));
    } catch (err) {
      if (seq !== requestSeq.current) return;
      setError(toDisplayError(err, 'load'));
    }
  }, [filter]);

  useEffect(() => {
    setData(null);
    setError(null);
    refresh();
    const timer = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  const runAction = useCallback(
    async (order: QueueOrder, action: string) => {
      setPendingId(order.id);
      try {
        await postAction(order.id, action);
        exitReasons.current.set(order.id, EXIT_BY_ACTION[action] ?? 'leave');
        setError(null);
      } catch (err) {
        setError(toDisplayError(err, 'action'));
      } finally {
        await refresh();
        setPendingId(null);
      }
    },
    [refresh],
  );

  return {
    data,
    error,
    pendingId,
    exitReasons,
    refresh,
    runAction,
    dismissError: () => setError(null),
  };
}
