import { createTheme } from '@mui/material/styles';

/**
 * Material Design 3 Theme Configuration
 *
 * This theme follows the M3 specification for:
 * - Color system (primary, secondary, tertiary, error, neutral variants)
 * - Typography scale
 * - Elevation system
 * - Shape system
 * - Motion system
 */

// M3 Color Palette - Primary (Red/Orange for fast food)
const primaryColors = {
  main: '#ef4444',      // Primary color (red-500)
  light: '#f87171',     // Primary-40
  dark: '#dc2626',      // Primary-80
  contrastText: '#ffffff',
};

// M3 Color Palette - Secondary
const secondaryColors = {
  main: '#f97316',      // Orange-500
  light: '#fb923c',     // Orange-400
  dark: '#ea580c',      // Orange-600
  contrastText: '#ffffff',
};

// M3 Color Palette - Tertiary
const tertiaryColors = {
  main: '#10b981',      // Green-500 (for success/ready states)
  light: '#34d399',     // Green-400
  dark: '#059669',      // Green-600
  contrastText: '#ffffff',
};

// M3 Color Palette - Error
const errorColors = {
  main: '#dc2626',      // Red-600
  light: '#ef4444',     // Red-500
  dark: '#b91c1c',      // Red-700
  contrastText: '#ffffff',
};

// M3 Color Palette - Warning
const warningColors = {
  main: '#f59e0b',      // Amber-500
  light: '#fbbf24',     // Amber-400
  dark: '#d97706',      // Amber-600
  contrastText: '#000000',
};

// M3 Color Palette - Info
const infoColors = {
  main: '#3b82f6',      // Blue-500
  light: '#60a5fa',     // Blue-400
  dark: '#2563eb',      // Blue-600
  contrastText: '#ffffff',
};

// M3 Color Palette - Success
const successColors = {
  main: '#10b981',      // Green-500
  light: '#34d399',     // Green-400
  dark: '#059669',      // Green-600
  contrastText: '#ffffff',
};

// M3 Typography Scale
const typography = {
  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',

  // Display styles (large, prominent text)
  displayLarge: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '57px',
    lineHeight: '64px',
    fontWeight: 400,
    letterSpacing: '-0.25px',
  },
  displayMedium: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '45px',
    lineHeight: '52px',
    fontWeight: 400,
    letterSpacing: '0px',
  },
  displaySmall: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '36px',
    lineHeight: '44px',
    fontWeight: 400,
    letterSpacing: '0px',
  },

  // Headline styles (medium-emphasis text)
  headlineLarge: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '32px',
    lineHeight: '40px',
    fontWeight: 400,
    letterSpacing: '0px',
  },
  headlineMedium: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '28px',
    lineHeight: '36px',
    fontWeight: 400,
    letterSpacing: '0px',
  },
  headlineSmall: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '24px',
    lineHeight: '32px',
    fontWeight: 400,
    letterSpacing: '0px',
  },

  // Title styles (medium-emphasis text, smaller than headline)
  titleLarge: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '22px',
    lineHeight: '28px',
    fontWeight: 500,
    letterSpacing: '0px',
  },
  titleMedium: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '16px',
    lineHeight: '24px',
    fontWeight: 500,
    letterSpacing: '0.15px',
  },
  titleSmall: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '14px',
    lineHeight: '20px',
    fontWeight: 500,
    letterSpacing: '0.1px',
  },

  // Label styles (small, utilitarian text)
  labelLarge: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '14px',
    lineHeight: '20px',
    fontWeight: 500,
    letterSpacing: '0.1px',
  },
  labelMedium: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '12px',
    lineHeight: '16px',
    fontWeight: 500,
    letterSpacing: '0.5px',
  },
  labelSmall: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '11px',
    lineHeight: '16px',
    fontWeight: 500,
    letterSpacing: '0.5px',
  },

  // Body styles (longer-form text)
  bodyLarge: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '16px',
    lineHeight: '24px',
    fontWeight: 400,
    letterSpacing: '0.5px',
  },
  bodyMedium: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '14px',
    lineHeight: '20px',
    fontWeight: 400,
    letterSpacing: '0.25px',
  },
  bodySmall: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '12px',
    lineHeight: '16px',
    fontWeight: 400,
    letterSpacing: '0.4px',
  },

  // MUI default mappings
  h1: {
    fontSize: '32px',
    lineHeight: '40px',
    fontWeight: 400,
    letterSpacing: '0px',
  },
  h2: {
    fontSize: '28px',
    lineHeight: '36px',
    fontWeight: 400,
    letterSpacing: '0px',
  },
  h3: {
    fontSize: '24px',
    lineHeight: '32px',
    fontWeight: 400,
    letterSpacing: '0px',
  },
  h4: {
    fontSize: '22px',
    lineHeight: '28px',
    fontWeight: 500,
    letterSpacing: '0px',
  },
  h5: {
    fontSize: '16px',
    lineHeight: '24px',
    fontWeight: 500,
    letterSpacing: '0.15px',
  },
  h6: {
    fontSize: '14px',
    lineHeight: '20px',
    fontWeight: 500,
    letterSpacing: '0.1px',
  },
  body1: {
    fontSize: '16px',
    lineHeight: '24px',
    fontWeight: 400,
    letterSpacing: '0.5px',
  },
  body2: {
    fontSize: '14px',
    lineHeight: '20px',
    fontWeight: 400,
    letterSpacing: '0.25px',
  },
  button: {
    fontSize: '14px',
    lineHeight: '20px',
    fontWeight: 500,
    letterSpacing: '0.1px',
    textTransform: 'none', // M3 uses sentence case, not uppercase
  },
  caption: {
    fontSize: '12px',
    lineHeight: '16px',
    fontWeight: 400,
    letterSpacing: '0.4px',
  },
  overline: {
    fontSize: '11px',
    lineHeight: '16px',
    fontWeight: 500,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },
};

// M3 Shape System (corner radius)
const shape = {
  borderRadius: 12, // Medium shape (default)
  borderRadiusSmall: 8,   // Small shape
  borderRadiusMedium: 12,  // Medium shape
  borderRadiusLarge: 16,   // Large shape
  borderRadiusExtraLarge: 28, // Extra large shape
  borderRadiusFull: 9999,  // Full/circular shape
};

// M3 Elevation System (shadows)
const shadows = [
  'none', // 0
  '0px 1px 2px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)', // 1
  '0px 1px 2px rgba(0, 0, 0, 0.3), 0px 2px 6px 2px rgba(0, 0, 0, 0.15)', // 2
  '0px 1px 3px rgba(0, 0, 0, 0.3), 0px 4px 8px 3px rgba(0, 0, 0, 0.15)', // 3
  '0px 2px 3px rgba(0, 0, 0, 0.3), 0px 6px 10px 4px rgba(0, 0, 0, 0.15)', // 4
  '0px 4px 4px rgba(0, 0, 0, 0.3), 0px 8px 12px 6px rgba(0, 0, 0, 0.15)', // 5
  ...Array(19).fill('none'), // Fill remaining to match MUI's 25 shadow levels
];

// M3 Motion System (durations and easings)
const transitions = {
  duration: {
    shortest: 100,      // Short-1 (100ms)
    shorter: 150,       // Short-2 (150ms)
    short: 200,         // Short-3 (200ms)
    standard: 250,      // Medium-1 (250ms)
    complex: 300,       // Medium-2 (300ms)
    enteringScreen: 250,
    leavingScreen: 200,
    long: 400,          // Long-1 (400ms)
    longer: 500,        // Long-2 (500ms)
    longest: 600,       // Long-3 (600ms)
  },
  easing: {
    // M3 easing curves
    emphasized: 'cubic-bezier(0.2, 0.0, 0, 1.0)',           // Emphasized
    emphasizedDecelerate: 'cubic-bezier(0.05, 0.7, 0.1, 1.0)', // Emphasized decelerate
    emphasizedAccelerate: 'cubic-bezier(0.3, 0.0, 0.8, 0.15)', // Emphasized accelerate
    standard: 'cubic-bezier(0.2, 0.0, 0, 1.0)',             // Standard
    standardDecelerate: 'cubic-bezier(0, 0, 0, 1.0)',       // Standard decelerate
    standardAccelerate: 'cubic-bezier(0.3, 0.0, 1, 1)',     // Standard accelerate
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
  },
};

// Create Light Theme
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: primaryColors,
    secondary: secondaryColors,
    tertiary: tertiaryColors, // M3 tertiary color
    error: errorColors,
    warning: warningColors,
    info: infoColors,
    success: successColors,

    // M3 Surface colors
    background: {
      default: '#fafafa',       // Surface-container-lowest
      paper: '#ffffff',         // Surface
    },

    // M3 Surface variants
    surface: {
      main: '#ffffff',
      dim: '#f5f5f5',
      bright: '#ffffff',
      containerLowest: '#ffffff',
      containerLow: '#f5f5f5',
      container: '#f0f0f0',
      containerHigh: '#ebebeb',
      containerHighest: '#e5e5e5',
    },

    // M3 Text colors
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',      // On-surface
      secondary: 'rgba(0, 0, 0, 0.60)',    // On-surface-variant
      disabled: 'rgba(0, 0, 0, 0.38)',
    },

    // Divider
    divider: 'rgba(0, 0, 0, 0.12)',

    // M3 Outline
    outline: {
      main: '#79747E',
      variant: '#C4C7C5',
    },
  },

  typography,
  shape,
  shadows,
  transitions,

  // Component overrides for M3 behavior
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 20,  // Fully rounded (pill shape) for M3
          textTransform: 'none', // Sentence case, not uppercase
          fontSize: '14px',
          fontWeight: 500,
          letterSpacing: '0.1px',
          padding: '10px 24px',
          minHeight: '40px',
          boxShadow: 'none', // M3 buttons don't have shadows by default
          '&:hover': {
            boxShadow: 'none',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12, // Medium shape
          boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)', // Elevation level 1
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8, // Small shape for chips
          height: '32px',
          fontSize: '14px',
          fontWeight: 500,
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          borderRadius: 16, // Large shape
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.3), 0px 4px 8px 3px rgba(0, 0, 0, 0.15)', // Elevation level 3
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 4, // Extra-small shape for text fields
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none', // M3 app bars have elevation when scrolled, not by default
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          height: '80px',
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.3), 0px 4px 8px 3px rgba(0, 0, 0, 0.15)', // Elevation level 3
        },
      },
    },
  },
});

// Create Dark Theme
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#f87171',      // Lighter for dark mode
      light: '#fca5a5',
      dark: '#ef4444',
      contrastText: '#000000',
    },
    secondary: {
      main: '#fb923c',
      light: '#fdba74',
      dark: '#f97316',
      contrastText: '#000000',
    },
    tertiary: {
      main: '#34d399',
      light: '#6ee7b7',
      dark: '#10b981',
      contrastText: '#000000',
    },
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#dc2626',
      contrastText: '#000000',
    },
    warning: {
      main: '#fbbf24',
      light: '#fcd34d',
      dark: '#f59e0b',
      contrastText: '#000000',
    },
    info: {
      main: '#60a5fa',
      light: '#93c5fd',
      dark: '#3b82f6',
      contrastText: '#000000',
    },
    success: {
      main: '#34d399',
      light: '#6ee7b7',
      dark: '#10b981',
      contrastText: '#000000',
    },

    // M3 Surface colors for dark mode
    background: {
      default: '#1a1a1a',       // Surface-container-lowest
      paper: '#1f1f1f',         // Surface
    },

    // M3 Surface variants
    surface: {
      main: '#1f1f1f',
      dim: '#141414',
      bright: '#3a3a3a',
      containerLowest: '#0f0f0f',
      containerLow: '#1a1a1a',
      container: '#1f1f1f',
      containerHigh: '#2a2a2a',
      containerHighest: '#353535',
    },

    // M3 Text colors for dark mode
    text: {
      primary: 'rgba(255, 255, 255, 0.87)',      // On-surface
      secondary: 'rgba(255, 255, 255, 0.60)',    // On-surface-variant
      disabled: 'rgba(255, 255, 255, 0.38)',
    },

    // Divider
    divider: 'rgba(255, 255, 255, 0.12)',

    // M3 Outline for dark mode
    outline: {
      main: '#938F99',
      variant: '#49454F',
    },
  },

  typography,
  shape,
  shadows: [
    'none', // 0
    '0px 1px 2px rgba(0, 0, 0, 0.5), 0px 1px 3px 1px rgba(0, 0, 0, 0.25)', // 1 - darker shadows for dark mode
    '0px 1px 2px rgba(0, 0, 0, 0.5), 0px 2px 6px 2px rgba(0, 0, 0, 0.25)', // 2
    '0px 1px 3px rgba(0, 0, 0, 0.5), 0px 4px 8px 3px rgba(0, 0, 0, 0.25)', // 3
    '0px 2px 3px rgba(0, 0, 0, 0.5), 0px 6px 10px 4px rgba(0, 0, 0, 0.25)', // 4
    '0px 4px 4px rgba(0, 0, 0, 0.5), 0px 8px 12px 6px rgba(0, 0, 0, 0.25)', // 5
    ...Array(19).fill('none'),
  ],
  transitions,

  // Component overrides (same as light theme)
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          textTransform: 'none',
          fontSize: '14px',
          fontWeight: 500,
          letterSpacing: '0.1px',
          padding: '10px 24px',
          minHeight: '40px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.5), 0px 1px 3px 1px rgba(0, 0, 0, 0.25)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.5), 0px 1px 3px 1px rgba(0, 0, 0, 0.25)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          height: '32px',
          fontSize: '14px',
          fontWeight: 500,
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.5), 0px 4px 8px 3px rgba(0, 0, 0, 0.25)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 4,
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          height: '80px',
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.5), 0px 4px 8px 3px rgba(0, 0, 0, 0.25)',
        },
      },
    },
  },
});

export default { lightTheme, darkTheme };
