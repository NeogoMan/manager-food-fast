import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { SidebarProvider, useSidebar } from './contexts/SidebarContext';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Menu from './pages/Menu';
import Orders from './pages/Orders';
import OrdersHistory from './pages/OrdersHistory';
import Kitchen from './pages/Kitchen';
import Users from './pages/Users';
import CustomerMenuM3 from './pages/CustomerMenuM3';
import Cart from './pages/Cart';
import MyOrdersM3 from './pages/MyOrdersM3';
import ClientProfile from './pages/ClientProfile';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import { ClientLayout } from './components/M3';
import useKioskMode from './hooks/useKioskMode';

/**
 * Staff Layout wrapper that provides responsive sidebar spacing
 * Adjusts main content margin based on sidebar collapse state
 */
function StaffLayout({ children }) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <Sidebar />
      <main
        className={`
          pt-16 md:pt-4
          ${isCollapsed ? 'md:ml-20' : 'md:ml-64'}
          px-4 md:px-6 lg:px-8
          py-4 md:py-6 lg:py-8
          transition-all duration-300
        `}
      >
        {children}
      </main>
    </div>
  );
}

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Enable kiosk mode for staff interface
  // Disabled for client interface to allow normal browser behavior
  const { isFullscreen, toggleFullscreen } = useKioskMode({
    enableFullscreen: true,
    blockKeyboardShortcuts: true,
    disableContextMenu: true,
    preventNavigation: true,
    autoEnterFullscreen: false, // Set to true for automatic fullscreen on load
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <SidebarProvider>
          <CartProvider>
            {/* Offline Banner */}
          {!isOnline && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                backgroundColor: '#dc2626',
                color: 'white',
                padding: '12px',
                textAlign: 'center',
                zIndex: 9999,
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              ⚠️ Pas de connexion Internet - Mode hors ligne activé
            </div>
          )}

          <div style={{ paddingTop: isOnline ? 0 : '48px' }}>
            <Router>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />

              {/* Protected Routes - Single entry point */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <Routes>
                      {/* Client Routes (M3 with Bottom Navigation, NO Navbar) */}
                      <Route
                        path="customer-menu"
                        element={
                          <ProtectedRoute allowedRoles={['client']}>
                            <ClientLayout />
                          </ProtectedRoute>
                        }
                      >
                        <Route index element={<CustomerMenuM3 />} />
                      </Route>
                      <Route
                        path="cart"
                        element={
                          <ProtectedRoute allowedRoles={['client']}>
                            <ClientLayout />
                          </ProtectedRoute>
                        }
                      >
                        <Route index element={<Cart />} />
                      </Route>
                      <Route
                        path="my-orders"
                        element={
                          <ProtectedRoute allowedRoles={['client']}>
                            <ClientLayout />
                          </ProtectedRoute>
                        }
                      >
                        <Route index element={<MyOrdersM3 />} />
                      </Route>
                      <Route
                        path="client-profile"
                        element={
                          <ProtectedRoute allowedRoles={['client']}>
                            <ClientLayout />
                          </ProtectedRoute>
                        }
                      >
                        <Route index element={<ClientProfile />} />
                      </Route>

                      {/* Staff Routes (Manager, Cashier, Cook - WITH Sidebar, NO Bottom Nav) */}
                      <Route
                        path="/"
                        element={
                          <ProtectedRoute allowedRoles={['manager', 'cashier']}>
                            <StaffLayout>
                              <Orders />
                            </StaffLayout>
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/dashboard"
                        element={
                          <ProtectedRoute allowedRoles={['manager']}>
                            <StaffLayout>
                              <Dashboard />
                            </StaffLayout>
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/menu"
                        element={
                          <ProtectedRoute allowedRoles={['manager', 'cashier']}>
                            <StaffLayout>
                              <Menu />
                            </StaffLayout>
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/orders-history"
                        element={
                          <ProtectedRoute allowedRoles={['manager', 'cashier']}>
                            <StaffLayout>
                              <OrdersHistory />
                            </StaffLayout>
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/kitchen"
                        element={
                          <ProtectedRoute allowedRoles={['manager', 'cook']}>
                            {/* Full-screen Kitchen interface - No Navbar for immersive cook experience */}
                            <Kitchen />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/users"
                        element={
                          <ProtectedRoute allowedRoles={['manager']}>
                            <StaffLayout>
                              <Users />
                            </StaffLayout>
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/profile"
                        element={
                          <ProtectedRoute allowedRoles={['manager', 'cashier', 'cook']}>
                            <StaffLayout>
                              <Profile />
                            </StaffLayout>
                          </ProtectedRoute>
                        }
                      />
                    </Routes>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Router>
          </div>
          </CartProvider>
        </SidebarProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
