import { useEffect, useRef, useState, type RefObject } from 'react';
import { motion, useAnimate, usePresence, useReducedMotion } from 'motion/react';
import type { QueueOrder } from '../api/types';
import type { ExitReason } from '../hooks/useQueue';
import { ActionButtons } from './ActionButtons';
import { OrderTypeTile } from './OrderTypeTile';
import { ScoreCountUp } from './ScoreCountUp';
import { STATUS_LABELS, formatDuration, humanize, promiseStatus } from './presentation';

interface Props {
  order: QueueOrder;
  index: number;
  topScore: number;
  generatedAt: string;
  isNextUp: boolean;
  pending: boolean;
  exitReasons: RefObject<Map<number, ExitReason>>;
  onAction: (order: QueueOrder, action: string) => void;
}

const STAGGER_S = 0.06;

export function QueueRow({ order, index, topScore, generatedAt, isNextUp, pending, exitReasons, onAction }: Props) {
  const [isPresent, safeToRemove] = usePresence();
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const reduce = useReducedMotion();
  const mounted = useRef(false);

  // Ball position is a straight ratio of the API's score to the top score in view.
  const ratio = topScore > 0 ? Math.min(1, Math.max(0, order.score / topScore)) : 0;
  const entranceDelay = mounted.current ? 0 : index * STAGGER_S;
  useEffect(() => {
    mounted.current = true;
  }, []);

  // Briefly highlight the card when the API reports a new status.
  const prevStatus = useRef(order.status);
  const [flashKey, setFlashKey] = useState(0);
  useEffect(() => {
    if (prevStatus.current !== order.status) {
      prevStatus.current = order.status;
      setFlashKey((k) => k + 1);
    }
  }, [order.status]);

  // Exit choreography: into the pass, fade (cancel), or a plain collapse.
  useEffect(() => {
    if (isPresent) return;
    const fallback: ExitReason = order.status === 'preparing' ? 'pass' : 'leave';
    const reason = exitReasons.current?.get(order.id) ?? fallback;
    exitReasons.current?.delete(order.id);
    if (reduce) {
      safeToRemove();
      return;
    }
    const ball =
      reason === 'pass'
        ? animate('[data-ball]', { left: '100%', scale: 0.4 }, { duration: 0.45, ease: [0.4, 0, 0.2, 1] })
        : reason === 'cancel'
          ? animate('[data-ball]', { opacity: 0, scale: 0.2 }, { duration: 0.35 })
          : Promise.resolve();
    scope.current.style.overflow = 'hidden';
    const collapse = animate(
      scope.current,
      { height: 0, opacity: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 },
      { duration: 0.35, delay: reason === 'leave' ? 0 : 0.3, ease: 'easeInOut' },
    );
    Promise.all([ball, collapse]).then(() => safeToRemove());
    // Runs once per presence change; the other values are read at exit time on purpose.
  }, [isPresent]);

  const promise = promiseStatus(order.promised_at, generatedAt);
  // A row on its way out hands the next-up highlight to the new first row immediately.
  const showNextUp = isNextUp && isPresent;

  return (
    <motion.div
      ref={scope}
      role="listitem"
      aria-label={`${order.customer_name}, ${order.score} points${showNextUp ? ', next up' : ''}`}
      className={`row${showNextUp ? ' row--next' : ''}`}
      layout={isPresent ? 'position' : false}
      transition={{ layout: { type: 'spring', stiffness: 380, damping: 34 } }}
    >
      <OrderTypeTile type={order.type} />

      <div className="card">
        {flashKey > 0 && <span key={flashKey} className="card__flash" aria-hidden />}
        <div className="card__head">
          <span className="card__name">{order.customer_name}</span>
          {order.is_vip && <span className="badge badge--vip">VIP</span>}
          <span className={`badge badge--status badge--${order.status}`}>
            {STATUS_LABELS[order.status] ?? humanize(order.status)}
          </span>
          {showNextUp && <span className="badge badge--next">next up</span>}
        </div>
        <p className="card__items">{order.items_summary}</p>
        <div className="card__score" title={breakdownTitle(order.score_breakdown)}>
          <span className="card__score-value">
            <ScoreCountUp value={order.score} delay={entranceDelay} />
          </span>
          <span className="card__score-unit">pts</span>
        </div>
      </div>

      <div className="lane" aria-hidden>
        {promise && (
          <span className={`lane__promise${promise.late ? ' lane__promise--late' : ''}`}>
            {promise.late
              ? `${formatDuration(promise.minutes)} late (${promise.clock})`
              : `due ${promise.clock}, in ${formatDuration(promise.minutes)}`}
          </span>
        )}
        <div className="lane__track">
          <motion.span
            data-ball
            className="lane__ball"
            initial={reduce ? false : { left: '0%', opacity: 0, scale: 0.5 }}
            animate={{ left: `${ratio * 100}%`, opacity: 1, scale: 1 }}
            transition={
              reduce
                ? { duration: 0 }
                : { type: 'spring', stiffness: 90, damping: 16, delay: entranceDelay }
            }
          />
        </div>
        <span className="lane__pass" />
      </div>

      <div className="wait">
        <span className="wait__value">{formatDuration(order.minutes_waiting)}</span>
        <span className="wait__label">waiting</span>
      </div>

      <ActionButtons order={order} pending={pending} onAction={onAction} />
    </motion.div>
  );
}

const breakdownTitle = (b: Record<string, number>) =>
  Object.entries(b)
    .map(([k, v]) => `${k} ${v}`)
    .join(', ');
