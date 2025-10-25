import { Card as MuiCard, CardContent, CardActions, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';

/**
 * M3 Card Component
 *
 * Material Design 3 Card with proper elevation, shape, and state layers
 * Supports: filled, elevated, outlined variants
 */

// Styled M3 Card with proper elevation and interactions
const StyledM3Card = styled(MuiCard, {
  shouldForwardProp: (prop) => prop !== 'variant' && prop !== 'interactive',
})(({ theme, variant = 'elevated', interactive = false }) => ({
  borderRadius: theme.shape.borderRadiusMedium || 12,
  transition: theme.transitions.create(['box-shadow', 'transform'], {
    duration: theme.transitions.duration.standard,
    easing: theme.transitions.easing.emphasizedDecelerate,
  }),

  // Variant styles
  ...(variant === 'elevated' && {
    backgroundColor: theme.palette.surface?.containerLow || theme.palette.background.paper,
    boxShadow: theme.shadows[1],
    '&:hover': interactive && {
      boxShadow: theme.shadows[2],
    },
  }),

  ...(variant === 'filled' && {
    backgroundColor: theme.palette.surface?.containerHighest || theme.palette.background.default,
    boxShadow: 'none',
  }),

  ...(variant === 'outlined' && {
    backgroundColor: theme.palette.surface?.main || theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: 'none',
  }),

  // Interactive styles
  ...(interactive && {
    cursor: 'pointer',
    '&:active': {
      transform: 'scale(0.98)',
    },
  }),
}));

/**
 * M3Card Component
 *
 * @param {object} props
 * @param {'elevated' | 'filled' | 'outlined'} props.variant - Card variant (default: 'elevated')
 * @param {boolean} props.interactive - Whether card is clickable (adds hover/active states)
 * @param {function} props.onClick - Click handler
 * @param {React.ReactNode} props.children - Card content
 * @param {object} props.sx - Additional MUI sx props
 */
export default function M3Card({
  variant = 'elevated',
  interactive = false,
  onClick,
  children,
  sx = {},
  ...props
}) {
  return (
    <StyledM3Card
      variant={variant}
      interactive={interactive || Boolean(onClick)}
      onClick={onClick}
      sx={sx}
      {...props}
    >
      {children}
    </StyledM3Card>
  );
}

// Export CardContent and CardActions for convenience
export { CardContent, CardActions };
