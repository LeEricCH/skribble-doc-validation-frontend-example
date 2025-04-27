'use client';
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1E88E5', // Main blue color for the app
    },
    secondary: {
      main: '#757575',
    },
    text: {
      primary: '#212121',
      secondary: '#5F6368',
    },
    background: {
      default: '#FFFFFF',
      paper: '#FFFFFF',
    },
    grey: {
      100: '#F5F5F5',
      200: '#EEEEEE',
      300: '#E0E0E0',
    }
  },
  shape: {
    borderRadius: 2, // Smaller border radius for more box-like design
  },
  typography: {
    fontFamily: 'var(--font-inter)',
    h4: {
      fontWeight: 700,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '0.875rem',
    },
    body2: {
      fontSize: '0.875rem',
    },
    caption: {
      fontSize: '0.75rem',
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          textTransform: 'none',
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.15)',
          '&:hover': {
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
          }
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.15)',
          borderRadius: 2,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
        fullWidth: true,
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#F5F5F5',
            borderRadius: 2,
            height: 40,
            '& fieldset': {
              borderColor: 'rgba(0, 0, 0, 0.12)',
              borderWidth: 1,
            },
            '&:hover fieldset': {
              borderColor: 'rgba(0, 0, 0, 0.25)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#1E88E5',
              borderWidth: 1,
            },
            '& input': {
              padding: '8px 12px',
              fontSize: '0.875rem',
              '&::placeholder': {
                color: 'rgba(0, 0, 0, 0.42)',
                opacity: 1,
              },
            },
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: 'rgba(0, 0, 0, 0.5)',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
          }
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.15)',
          borderRadius: 2,
        },
        elevation1: {
          boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.15)',
        },
      },
    },
  },
});

export default theme; 