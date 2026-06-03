import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    primary: { main: '#43a047', dark: '#2e7d32' },
    secondary: { main: '#7e57c2' },
    background: { default: '#f3f7ef', paper: '#ffffff' },
    text: { primary: '#253323', secondary: '#5e6b58' },
    error: { main: '#e53935' },
    warning: { main: '#fb8c00' },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft JhengHei", Arial, sans-serif',
  },
  shape: { borderRadius: 11 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 999, fontWeight: 700, textTransform: 'none' },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 999 },
      },
    },
  },
})
