import { createTheme, alpha } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#7c3aed' },
    secondary: { main: '#10b981' },
    error: { main: '#ef4444' },
    warning: { main: '#f59e0b' },
    info: { main: '#3b82f6' },
    success: { main: '#10b981' },
    background: {
      default: '#0a0a0f',
      paper: 'rgba(255,255,255,0.04)',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255,255,255,0.7)',
      disabled: 'rgba(255,255,255,0.3)',
    },
    divider: 'rgba(255,255,255,0.08)',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    body1: { color: 'rgba(255,255,255,0.7)' },
    body2: { color: 'rgba(255,255,255,0.5)' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#0a0a0f',
          backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(124,58,237,0.04) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(59,130,246,0.04) 0%, transparent 50%)',
          minHeight: '100vh',
        },
        '*::-webkit-scrollbar': { width: '4px', height: '4px' },
        '*::-webkit-scrollbar-track': { background: 'transparent' },
        '*::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.12)', borderRadius: '4px' },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          '&:hover': {
            borderColor: 'rgba(124,58,237,0.3)',
            boxShadow: '0 0 0 1px rgba(124,58,237,0.15)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: '10px',
        },
        contained: {
          background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
          boxShadow: '0 4px 15px rgba(124,58,237,0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            boxShadow: '0 4px 20px rgba(124,58,237,0.5)',
          },
        },
        outlined: {
          borderColor: 'rgba(255,255,255,0.12)',
          '&:hover': { borderColor: 'rgba(124,58,237,0.5)', backgroundColor: 'rgba(124,58,237,0.05)' },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 500 },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(10,10,15,0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          boxShadow: 'none',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: 'rgba(10,10,15,0.95)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
            '&:hover fieldset': { borderColor: 'rgba(124,58,237,0.4)' },
            '&.Mui-focused fieldset': { borderColor: '#7c3aed' },
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '4px' },
        bar: { borderRadius: '4px' },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: 'rgba(255,255,255,0.08)' },
      },
    },
  },
});

export const glassCard = {
  backdropFilter: 'blur(20px)',
  backgroundColor: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
};

export const accentGlow = (color: string) => ({
  boxShadow: `0 0 20px ${alpha(color, 0.2)}`,
});

export default theme;
