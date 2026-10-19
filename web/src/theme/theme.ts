import { createTheme } from '@mui/material';

export const tokens = {
  ink: '#050607',
  panel: '#0C0E10',
  line: '#1F2328',
  card: '#121519',
  cardLine: '#262B31',
  text: '#E6E8EA',
  muted: '#8B929B',
  heat: '#FFB341',
  alarm: '#FF4B3E',
} as const;

const mono = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: tokens.ink, paper: tokens.panel },
    text: { primary: tokens.text, secondary: tokens.muted },
    primary: { main: tokens.heat, contrastText: tokens.ink },
    error: { main: tokens.alarm },
    divider: tokens.line,
  },
  typography: {
    fontFamily: mono,
    fontSize: 13,
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: 0 },
  },
  shape: { borderRadius: 6 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true, size: 'small' },
      styleOverrides: { root: { minWidth: 0, paddingInline: 12 } },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          paddingBlock: 4,
          paddingInline: 12,
          color: tokens.muted,
          borderColor: tokens.line,
          '&.Mui-selected': {
            color: tokens.ink,
            backgroundColor: tokens.heat,
            '&:hover': { backgroundColor: tokens.heat },
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: { root: { fontFamily: mono, alignItems: 'flex-start' } },
    },
  },
});
