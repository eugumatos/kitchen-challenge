import { Alert, AlertTitle } from '@mui/material';
import type { DisplayError } from '../hooks/useQueue';
import { ERROR_TITLES } from './presentation';

export function ErrorBanner({ error, onClose }: { error: DisplayError; onClose: () => void }) {
  const fallbackTitle = error.context === 'load' ? 'Could not load the queue' : 'Action failed';
  return (
    <Alert severity="error" variant="outlined" onClose={onClose} className="error-banner" role="alert">
      <AlertTitle>{ERROR_TITLES[error.code] ?? fallbackTitle}</AlertTitle>
      <span className="error-banner__message">{error.message}</span>
      <code className="error-banner__code">{error.code}</code>
    </Alert>
  );
}
