import { IconButton, useTheme as useMuiTheme } from '@mui/material';
import { styled } from '@mui/material/styles';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useContext } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';

/**
 * M3 Theme Toggle Component
 *
 * Material Design 3 theme switcher with sun/moon icons
 * Toggles between light and dark themes with smooth transitions
 */

// Styled IconButton with M3 specifications
const StyledThemeToggle = styled(IconButton)(({ theme }) => ({
  width: '48px',
  height: '48px',
  borderRadius: '50%',
  transition: theme.transitions.create(['background-color', 'transform'], {
    duration: theme.transitions.duration.short,
    easing: theme.transitions.easing.emphasizedDecelerate,
  }),

  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.08)'
      : 'rgba(0, 0, 0, 0.04)',
  },

  '&:active': {
    transform: 'scale(0.95)',
  },

  // Icon styles
  '& .MuiSvgIcon-root': {
    fontSize: '24px',
    transition: theme.transitions.create(['transform', 'color'], {
      duration: theme.transitions.duration.short,
    }),
  },
}));

/**
 * M3ThemeToggle Component
 *
 * @param {object} props.sx - Additional MUI sx props
 */
export default function M3ThemeToggle({ sx = {} }) {
  const muiTheme = useMuiTheme();
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <StyledThemeToggle
      onClick={toggleTheme}
      aria-label={theme === 'light' ? 'Passer en mode sombre' : 'Passer en mode clair'}
      title={theme === 'light' ? 'Mode sombre' : 'Mode clair'}
      sx={sx}
    >
      {theme === 'light' ? (
        <DarkModeIcon sx={{ color: muiTheme.palette.text.primary }} />
      ) : (
        <LightModeIcon sx={{ color: muiTheme.palette.warning.main }} />
      )}
    </StyledThemeToggle>
  );
}
