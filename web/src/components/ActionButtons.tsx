import { useEffect, useState } from 'react';
import { Button, CircularProgress } from '@mui/material';
import type { QueueOrder } from '../api/types';
import { ACTION_LABELS, humanize } from './presentation';

const CONFIRM_WINDOW_MS = 4000;

interface Props {
  order: QueueOrder;
  pending: boolean;
  onAction: (order: QueueOrder, action: string) => void;
}

// One button per available_actions entry, exactly as the API sent them.
export function ActionButtons({ order, pending, onAction }: Props) {
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  useEffect(() => {
    if (!confirmingCancel) return;
    const timer = setTimeout(() => setConfirmingCancel(false), CONFIRM_WINDOW_MS);
    return () => clearTimeout(timer);
  }, [confirmingCancel]);

  if (pending) {
    return (
      <div className="actions">
        <CircularProgress size={16} aria-label="Applying action" />
      </div>
    );
  }

  return (
    <div className="actions">
      {order.available_actions.map((action) => {
        if (action === 'cancel') {
          return confirmingCancel ? (
            <Button
              key="cancel-confirm"
              color="error"
              variant="contained"
              onClick={() => {
                setConfirmingCancel(false);
                onAction(order, action);
              }}
              aria-label={`Confirm cancelling the order for ${order.customer_name}`}
              autoFocus
            >
              Confirm cancel
            </Button>
          ) : (
            <Button
              key={action}
              color="inherit"
              variant="text"
              className="actions__cancel"
              onClick={() => setConfirmingCancel(true)}
            >
              {ACTION_LABELS.cancel}
            </Button>
          );
        }
        return (
          <Button key={action} variant="contained" onClick={() => onAction(order, action)}>
            {ACTION_LABELS[action] ?? humanize(action)}
          </Button>
        );
      })}
    </div>
  );
}
