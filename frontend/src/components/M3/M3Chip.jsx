import { Chip as MuiChip } from '@mui/material';
import { styled } from '@mui/material/styles';
import CheckIcon from '@mui/icons-material/Check';

/**
 * M3 Chip Component
 *
 * Material Design 3 Filter Chip with proper styling
 * Supports: filter, assist, input, suggestion variants
 */

// Styled M3 Chip
const StyledM3Chip = styled(MuiChip, {
  shouldForwardProp: (prop) => prop !== 'variant' && prop !== 'selected',
})(({ theme, variant = 'filter', selected = false }) => ({
  height: '32px',
  borderRadius: theme.shape.borderRadiusSmall || 8,
  fontSize: '14px',
  fontWeight: 500,
  letterSpacing: '0.1px',
  transition: theme.transitions.create(['background-color', 'border-color', 'box-shadow'], {
    duration: theme.transitions.duration.short,
    easing: theme.transitions.easing.emphasizedDecelerate,
  }),

  // Filter Chip (for category filters)
  ...(variant === 'filter' && {
    ...(selected
      ? {
          backgroundColor: theme.palette.secondary.light,
          color: theme.palette.mode === 'dark' ? '#000000' : theme.palette.secondary.contrastText,
          border: 'none',
          '&:hover': {
            backgroundColor: theme.palette.secondary.main,
          },
        }
      : {
          backgroundColor: 'transparent',
          color: theme.palette.text.primary,
          border: `1px solid ${theme.palette.divider}`,
          '&:hover': {
            backgroundColor: theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(0, 0, 0, 0.04)',
          },
        }),
  }),

  // Assist Chip (for status badges)
  ...(variant === 'assist' && {
    backgroundColor: theme.palette.surface?.container || theme.palette.background.default,
    color: theme.palette.text.primary,
    border: 'none',
    '&:hover': {
      backgroundColor: theme.palette.surface?.containerHigh || theme.palette.background.paper,
    },
  }),

  // Touch target
  minHeight: '32px',
  padding: '0 16px',

  // State layers
  '&:focus': {
    boxShadow: `0 0 0 2px ${theme.palette.primary.main}40`,
  },

  '&:active': {
    transform: 'scale(0.95)',
  },

  // Icon styles
  '& .MuiChip-icon': {
    marginLeft: '8px',
    marginRight: '-4px',
  },

  '& .MuiChip-deleteIcon': {
    marginRight: '4px',
    marginLeft: '-4px',
  },
}));

/**
 * M3Chip Component
 *
 * @param {object} props
 * @param {'filter' | 'assist' | 'input' | 'suggestion'} props.variant - Chip variant (default: 'filter')
 * @param {boolean} props.selected - Whether chip is selected (for filter chips)
 * @param {string} props.label - Chip label text
 * @param {function} props.onClick - Click handler
 * @param {React.ReactNode} props.icon - Icon element
 * @param {function} props.onDelete - Delete handler
 * @param {object} props.sx - Additional MUI sx props
 */
export default function M3Chip({
  variant = 'filter',
  selected = false,
  label,
  onClick,
  icon,
  onDelete,
  sx = {},
  ...props
}) {
  // Show checkmark icon when selected (for filter chips)
  const chipIcon = variant === 'filter' && selected ? <CheckIcon /> : icon;

  return (
    <StyledM3Chip
      variant={variant}
      selected={selected}
      label={label}
      onClick={onClick}
      icon={chipIcon}
      onDelete={onDelete}
      sx={sx}
      {...props}
    />
  );
}
