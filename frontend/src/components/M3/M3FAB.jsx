import { Fab as MuiFab, Badge, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';

/**
 * M3 FAB (Floating Action Button) Component
 *
 * Material Design 3 FAB with proper elevation and styling
 * Supports: small, medium, large, extended variants
 */

// Styled M3 FAB
const StyledM3FAB = styled(MuiFab, {
  shouldForwardProp: (prop) => prop !== 'variant',
})(({ theme, variant = 'large' }) => ({
  boxShadow: theme.shadows[3], // Elevation level 3
  transition: theme.transitions.create(['box-shadow', 'transform'], {
    duration: theme.transitions.duration.short,
    easing: theme.transitions.easing.emphasizedDecelerate,
  }),

  '&:hover': {
    boxShadow: theme.shadows[4],
  },

  '&:active': {
    transform: 'scale(0.95)',
    boxShadow: theme.shadows[3],
  },

  // Size variants
  ...(variant === 'small' && {
    width: '40px',
    height: '40px',
    minHeight: '40px',
  }),

  ...(variant === 'medium' && {
    width: '56px',
    height: '56px',
    minHeight: '56px',
  }),

  ...(variant === 'large' && {
    width: '56px',
    height: '56px',
    minHeight: '56px',
  }),

  // Extended FAB
  ...(variant === 'extended' && {
    height: '56px',
    minHeight: '56px',
    borderRadius: theme.shape.borderRadiusLarge || 16,
    padding: '0 20px',
    gap: '12px',
  }),
}));

// Styled Badge for notification count
const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    right: -3,
    top: 3,
    backgroundColor: theme.palette.error.main,
    color: theme.palette.error.contrastText,
    fontSize: '12px',
    fontWeight: 600,
    height: '20px',
    minWidth: '20px',
    borderRadius: '10px',
    padding: '0 6px',
    border: `2px solid ${theme.palette.background.paper}`,
    animation: 'pulse 2s infinite',
  },
  '@keyframes pulse': {
    '0%': {
      transform: 'scale(1)',
    },
    '50%': {
      transform: 'scale(1.1)',
    },
    '100%': {
      transform: 'scale(1)',
    },
  },
}));

/**
 * M3FAB Component
 *
 * @param {object} props
 * @param {'small' | 'medium' | 'large' | 'extended'} props.variant - FAB size variant (default: 'large')
 * @param {string} props.color - FAB color (primary, secondary, etc.)
 * @param {number} props.badgeCount - Badge notification count (0 to hide badge)
 * @param {React.ReactNode} props.icon - Icon element
 * @param {string} props.label - Label text (for extended FAB)
 * @param {function} props.onClick - Click handler
 * @param {object} props.sx - Additional MUI sx props
 * @param {object} props.style - Inline styles for positioning
 */
export default function M3FAB({
  variant = 'large',
  color = 'primary',
  badgeCount = 0,
  icon,
  label,
  onClick,
  sx = {},
  style = {},
  ...props
}) {
  const theme = useTheme();

  const fab = (
    <StyledM3FAB
      variant={variant}
      color={color}
      onClick={onClick}
      sx={sx}
      style={style}
      aria-label={label || 'floating action button'}
      {...props}
    >
      {icon}
      {variant === 'extended' && label && (
        <span style={{ fontSize: '14px', fontWeight: 500 }}>{label}</span>
      )}
    </StyledM3FAB>
  );

  // Wrap with badge if badgeCount > 0
  if (badgeCount > 0) {
    return (
      <StyledBadge badgeContent={badgeCount} color="error">
        {fab}
      </StyledBadge>
    );
  }

  return fab;
}
