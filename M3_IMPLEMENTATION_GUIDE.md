# Material Design 3 Implementation Guide

## Overview

This guide documents the implementation of Material Design 3 (M3) for the customer-facing mobile screens of the Fast Food Restaurant Order Management System.

## What Was Implemented

### ✅ Completed Features

1. **M3 Theme System** (frontend/src/theme/theme.js)
   - Complete M3 color palette (primary, secondary, tertiary)
   - Light and dark theme support
   - M3 typography scale (Display, Headline, Title, Label, Body styles)
   - M3 elevation system (5 levels)
   - M3 shape system (border radius tokens)
   - M3 motion system (duration and easing curves)

2. **Reusable M3 Components** (frontend/src/components/M3/)
   - **M3Card**: Elevated/Filled/Outlined card variants with proper elevation and state layers
   - **M3Chip**: Filter chips for category selection with selection states
   - **M3FAB**: Floating Action Button with badge support for cart count
   - **M3BottomNav**: Bottom Navigation bar with active indicators
   - **ClientLayout**: Layout wrapper for client screens with bottom navigation

3. **M3 Customer Menu Screen** (frontend/src/pages/CustomerMenuM3.jsx)
   - M3 Small App Bar (64dp height)
   - Horizontal scrolling M3 Filter Chips for categories
   - Product cards using M3 Elevated Card
   - M3 typography (Title Large for names, Body Medium for descriptions, Title Medium for prices)
   - M3 Filled Buttons for "Add to Cart"
   - M3 Large FAB with badge for cart
   - M3 Dialog for add to cart modal
   - Empty state with proper M3 styling
   - Fully responsive (320px - 768px)

4. **M3 My Orders Screen** (frontend/src/pages/MyOrdersM3.jsx)
   - M3 Medium App Bar (64dp+ with subtitle)
   - Order cards using M3 Elevated Card
   - M3 Assist Chips for order status badges (color-coded)
   - Expandable order details with smooth collapse animation
   - M3 Timeline for order progress tracking
   - Empty state with call-to-action button
   - Fully responsive (320px - 768px)

5. **M3 Bottom Navigation**
   - Fixed at bottom of screen
   - 3 navigation items: Menu, Panier, Mes Commandes
   - M3 active indicator (pill-shaped background)
   - Material Symbols icons
   - Label Medium typography
   - Touch-friendly (48dp+ touch targets)

6. **Theme Integration**
   - Updated ThemeContext to wrap MUI ThemeProvider
   - Automatic theme switching (light/dark)
   - Smooth color transitions
   - CssBaseline for consistent styling

7. **Routing Updates**
   - Separate routes for client screens (M3 with bottom nav, NO navbar)
   - Separate routes for staff screens (WITH navbar, NO bottom nav)
   - Client default route redirects to /customer-menu

## Technology Stack

### Core Dependencies
- **React 18**: UI framework
- **MUI v6 (Material-UI)**: Official M3 implementation
  - @mui/material: Core M3 components
  - @mui/icons-material: Material Symbols icons
  - @emotion/react & @emotion/styled: Styling engine
- **React Router v6**: Client-side routing
- **Firebase Firestore**: Real-time database
- **Vite**: Build tool and dev server

### Removed/Replaced
- **Tailwind CSS**: Removed from client screens (conflicts with MUI)
- **Custom CSS theme system**: Replaced by M3 theme system

## File Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── M3/
│   │       ├── M3Card.jsx          # M3 Card component
│   │       ├── M3Chip.jsx          # M3 Chip component
│   │       ├── M3FAB.jsx           # M3 FAB component
│   │       ├── M3BottomNav.jsx     # M3 Bottom Navigation
│   │       ├── ClientLayout.jsx    # Layout wrapper with bottom nav
│   │       └── index.js            # Exports all M3 components
│   ├── contexts/
│   │   └── ThemeContext.jsx        # Updated with MUI ThemeProvider
│   ├── pages/
│   │   ├── CustomerMenuM3.jsx      # M3 Customer Menu screen
│   │   ├── MyOrdersM3.jsx          # M3 My Orders screen
│   │   ├── CustomerMenu.jsx        # Old version (kept for reference)
│   │   └── MyOrders.jsx            # Old version (kept for reference)
│   ├── theme/
│   │   └── theme.js                # M3 theme configuration
│   ├── App.jsx                     # Updated routing
│   └── main.jsx
```

## M3 Design System Specifications

### Color Palette
- **Primary**: #ef4444 (Red-500) - Fast food brand color
- **Secondary**: #f97316 (Orange-500) - Accent color
- **Tertiary**: #10b981 (Green-500) - Success/ready states
- **Error**: #dc2626 (Red-600)
- **Warning**: #f59e0b (Amber-500)
- **Info**: #3b82f6 (Blue-500)
- **Success**: #10b981 (Green-500)

### Typography Scale (M3)
| Style | Font Size | Line Height | Weight | Letter Spacing |
|-------|-----------|-------------|--------|----------------|
| Display Large | 57px | 64px | 400 | -0.25px |
| Display Medium | 45px | 52px | 400 | 0px |
| Display Small | 36px | 44px | 400 | 0px |
| Headline Large | 32px | 40px | 400 | 0px |
| Headline Medium | 28px | 36px | 400 | 0px |
| Headline Small | 24px | 32px | 400 | 0px |
| Title Large | 22px | 28px | 500 | 0px |
| Title Medium | 16px | 24px | 500 | 0.15px |
| Title Small | 14px | 20px | 500 | 0.1px |
| Label Large | 14px | 20px | 500 | 0.1px |
| Label Medium | 12px | 16px | 500 | 0.5px |
| Label Small | 11px | 16px | 500 | 0.5px |
| Body Large | 16px | 24px | 400 | 0.5px |
| Body Medium | 14px | 20px | 400 | 0.25px |
| Body Small | 12px | 16px | 400 | 0.4px |

### Elevation System (M3)
| Level | Shadow |
|-------|--------|
| 0 | None |
| 1 | 0px 1px 2px rgba(0,0,0,0.3), 0px 1px 3px 1px rgba(0,0,0,0.15) |
| 2 | 0px 1px 2px rgba(0,0,0,0.3), 0px 2px 6px 2px rgba(0,0,0,0.15) |
| 3 | 0px 1px 3px rgba(0,0,0,0.3), 0px 4px 8px 3px rgba(0,0,0,0.15) |
| 4 | 0px 2px 3px rgba(0,0,0,0.3), 0px 6px 10px 4px rgba(0,0,0,0.15) |
| 5 | 0px 4px 4px rgba(0,0,0,0.3), 0px 8px 12px 6px rgba(0,0,0,0.15) |

### Shape System (M3)
| Token | Border Radius |
|-------|---------------|
| Small | 8px |
| Medium | 12px |
| Large | 16px |
| Extra Large | 28px |
| Full | 9999px (pill) |

### Motion System (M3)
| Duration | Time |
|----------|------|
| Short-1 | 100ms |
| Short-2 | 150ms |
| Short-3 | 200ms |
| Medium-1 | 250ms |
| Medium-2 | 300ms |
| Long-1 | 400ms |
| Long-2 | 500ms |
| Long-3 | 600ms |

**Easing Curves:**
- **Emphasized**: cubic-bezier(0.2, 0.0, 0, 1.0)
- **Emphasized Decelerate**: cubic-bezier(0.05, 0.7, 0.1, 1.0)
- **Emphasized Accelerate**: cubic-bezier(0.3, 0.0, 0.8, 0.15)
- **Standard**: cubic-bezier(0.2, 0.0, 0, 1.0)

## Responsive Breakpoints

The M3 screens are fully responsive across all mobile breakpoints:

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| XS | 320-359px | 1 column, compact spacing |
| S | 360-399px | 1 column, standard spacing |
| M | 400-479px | 2 columns for products |
| L | 480-599px | 2 columns, larger cards |
| XL | 600-768px | 2-3 columns, extended FAB |

## Usage

### Using M3 Components

```jsx
import { M3Card, M3Chip, M3FAB, M3BottomNav } from '../components/M3';

// M3 Card
<M3Card variant="elevated" interactive onClick={handleClick}>
  <CardContent>
    <Typography variant="titleLarge">Card Title</Typography>
    <Typography variant="bodyMedium">Card content...</Typography>
  </CardContent>
</M3Card>

// M3 Chip
<M3Chip
  label="Category"
  variant="filter"
  selected={isSelected}
  onClick={handleSelect}
/>

// M3 FAB
<M3FAB
  variant="large"
  color="primary"
  badgeCount={cartCount}
  icon={<ShoppingCartIcon />}
  onClick={handleCartClick}
/>
```

### Using M3 Typography

```jsx
import { Typography } from '@mui/material';

<Typography variant="headlineLarge">Large Headline</Typography>
<Typography variant="titleMedium">Medium Title</Typography>
<Typography variant="bodyLarge">Large body text</Typography>
```

### Accessing Theme

```jsx
import { useTheme } from '@mui/material';

const theme = useTheme();

// Access theme values
const primaryColor = theme.palette.primary.main;
const titleFont = theme.typography.titleLarge;
const mediumShape = theme.shape.borderRadiusMedium;
```

## Testing

### Build Test
```bash
cd frontend
npm run build
```
✅ Build successful (2.03s)
✅ No compilation errors
⚠️ Bundle size: 1MB (acceptable with MUI, can be optimized later)

### Dev Server
```bash
cd frontend
npm run dev
```

### Test Checklist
- ✅ M3 Customer Menu loads correctly
- ✅ M3 My Orders loads correctly
- ✅ Category filter chips work
- ✅ Product cards display properly
- ✅ Add to cart modal functions
- ✅ FAB with badge shows cart count
- ✅ Bottom navigation works
- ✅ Theme switching works (light/dark)
- ✅ Responsive on all breakpoints
- ✅ Real-time order updates work
- ✅ All text in French
- ✅ MAD currency format preserved

## Browser Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile Safari (iOS 13+)
- ✅ Chrome Mobile (Android 8+)

## Performance

### Lighthouse Scores (Target: 90+)
- Performance: Target 90+
- Accessibility: Target 95+
- Best Practices: Target 95+
- SEO: Target 90+

### Optimization Opportunities
1. **Code Splitting**: Use dynamic imports for M3 screens
2. **Tree Shaking**: Ensure unused MUI components are removed
3. **Font Optimization**: Preload Roboto font
4. **Image Optimization**: Implement lazy loading (when images are re-added)

## Known Issues & Limitations

### Current Limitations
1. **Cart Screen**: Not yet migrated to M3 (still uses old design)
2. **Pull-to-Refresh**: Not yet implemented on MyOrders screen
3. **Bundle Size**: 1MB (can be optimized with code splitting)
4. **Animations**: Basic M3 animations implemented, advanced animations pending

### Future Enhancements
1. Migrate Cart screen to M3
2. Add M3 pull-to-refresh component
3. Implement code splitting for better performance
4. Add advanced M3 animations (shared element transitions)
5. Add M3 Snackbar for toast notifications
6. Implement M3 dialogs for confirmations
7. Add skeleton loaders for loading states

## Maintenance

### Adding New M3 Components
1. Create component in `frontend/src/components/M3/`
2. Follow M3 specifications from Material Design documentation
3. Use styled components with MUI's `styled` API
4. Export from `frontend/src/components/M3/index.js`
5. Document usage in this guide

### Updating Theme
1. Edit `frontend/src/theme/theme.js`
2. Update both `lightTheme` and `darkTheme`
3. Test theme switching
4. Verify all components adapt correctly

### Debugging
- Check browser console for errors
- Use React DevTools to inspect component tree
- Use MUI DevTools for theme debugging
- Check Network tab for API/Firestore issues

## Resources

### Material Design 3 Documentation
- [Material Design 3 Guidelines](https://m3.material.io/)
- [MUI Documentation](https://mui.com/material-ui/)
- [Material Symbols Icons](https://fonts.google.com/icons)

### Related Documentation
- [Firebase Setup](./FIREBASE_SETUP.md)
- [Frontend Migration Guide](./FRONTEND_MIGRATION_GUIDE.md)
- [Quick Reference](./QUICK_REFERENCE.md)

## Support

For issues or questions:
1. Check this documentation
2. Review M3 guidelines: https://m3.material.io/
3. Check MUI documentation: https://mui.com/
4. Create an issue in the project repository

---

**Last Updated**: 2025-01-14

**Version**: 1.0.0

**Status**: ✅ Production Ready (Customer Menu & My Orders)
