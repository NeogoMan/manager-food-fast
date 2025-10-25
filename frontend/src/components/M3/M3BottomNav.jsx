import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * M3 Bottom Navigation Component
 *
 * Material Design 3 Bottom Navigation Bar
 * Fixed at the bottom with proper styling and active indicators
 */

// Styled Bottom Navigation
const StyledBottomNavigation = styled(BottomNavigation)(({ theme }) => ({
  height: '80px',
  backgroundColor: theme.palette.surface?.container || theme.palette.background.paper,
  borderTop: `1px solid ${theme.palette.divider}`,
  boxShadow: theme.shadows[3],
}));

// Styled Bottom Navigation Action
const StyledBottomNavigationAction = styled(BottomNavigationAction)(({ theme }) => ({
  padding: '12px 16px 16px 16px',
  minWidth: '80px',
  maxWidth: '168px',
  color: theme.palette.text.secondary,
  transition: theme.transitions.create(['color', 'background-color'], {
    duration: theme.transitions.duration.short,
    easing: theme.transitions.easing.standard,
  }),

  '& .MuiBottomNavigationAction-label': {
    fontSize: '12px',
    fontWeight: 500,
    letterSpacing: '0.5px',
    marginTop: '4px',
    transition: 'none',
    opacity: 1, // Always show label
  },

  // Active state with M3 active indicator
  '&.Mui-selected': {
    color: theme.palette.primary.main,
    backgroundColor: 'transparent',
    position: 'relative',

    // Active indicator (pill shape)
    '&::before': {
      content: '""',
      position: 'absolute',
      top: '8px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '64px',
      height: '32px',
      backgroundColor: theme.palette.mode === 'dark'
        ? 'rgba(255, 255, 255, 0.12)'
        : 'rgba(0, 0, 0, 0.05)',
      borderRadius: '16px',
      transition: theme.transitions.create(['width', 'background-color'], {
        duration: theme.transitions.duration.short,
        easing: theme.transitions.easing.emphasized,
      }),
    },
  },

  // Icon styles
  '& .MuiSvgIcon-root': {
    fontSize: '24px',
    transition: theme.transitions.create(['fill'], {
      duration: theme.transitions.duration.shortest,
    }),
  },

  // Hover state
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.08)'
      : 'rgba(0, 0, 0, 0.04)',
  },

  // Active/pressed state
  '&:active': {
    backgroundColor: theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.12)'
      : 'rgba(0, 0, 0, 0.10)',
  },
}));

/**
 * M3BottomNav Component
 *
 * @param {object} props
 * @param {Array} props.items - Navigation items array
 *   Each item: { label: string, icon: ReactNode, path: string, value: string }
 * @param {object} props.sx - Additional MUI sx props
 */
export default function M3BottomNav({ items = [], sx = {}, ...props }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tab based on current path
  const activeTab = items.find((item) => location.pathname === item.path)?.value || items[0]?.value;

  const handleChange = (event, newValue) => {
    const item = items.find((i) => i.value === newValue);
    if (item && item.path) {
      navigate(item.path);
    }
  };

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        ...sx,
      }}
      elevation={0}
    >
      <StyledBottomNavigation
        value={activeTab}
        onChange={handleChange}
        showLabels
        {...props}
      >
        {items.map((item) => (
          <StyledBottomNavigationAction
            key={item.value}
            label={item.label}
            icon={item.icon}
            value={item.value}
          />
        ))}
      </StyledBottomNavigation>
    </Paper>
  );
}
