import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PersonIcon from '@mui/icons-material/Person';
import M3BottomNav from './M3BottomNav';

/**
 * Client Layout Component
 *
 * Layout wrapper for client screens with M3 Bottom Navigation
 */
export default function ClientLayout() {
  const navItems = [
    {
      label: 'Menu',
      icon: <RestaurantMenuIcon />,
      path: '/customer-menu',
      value: 'menu',
    },
    {
      label: 'Panier',
      icon: <ShoppingCartIcon />,
      path: '/cart',
      value: 'cart',
    },
    {
      label: 'Commandes',
      icon: <ReceiptLongIcon />,
      path: '/my-orders',
      value: 'orders',
    },
    {
      label: 'Profil',
      icon: <PersonIcon />,
      path: '/client-profile',
      value: 'profile',
    },
  ];

  return (
    <Box>
      {/* Page Content */}
      <Box sx={{ minHeight: '100vh', pb: '80px' }}>
        <Outlet />
      </Box>

      {/* M3 Bottom Navigation */}
      <M3BottomNav items={navItems} />
    </Box>
  );
}
