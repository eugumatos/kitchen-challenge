import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { MotionConfig } from 'motion/react';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/600.css';
import '@fontsource/jetbrains-mono/700.css';
import './theme/kitchen.css';
import { theme } from './theme/theme';
import { KitchenDisplay } from './components/KitchenDisplay';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <MotionConfig reducedMotion="user">
        <KitchenDisplay />
      </MotionConfig>
    </ThemeProvider>
  </StrictMode>,
);
