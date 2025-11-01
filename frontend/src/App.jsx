import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import Navbar from './components/Navbar';
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
import AdminLayout from './components/AdminLayout';
import Restaurants from './pages/admin/Restaurants';
import CreateRestaurant from './pages/admin/CreateRestaurant';

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

              {/* Admin Routes (Super Admin Only) */}
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="restaurants" element={<Restaurants />} />
                <Route path="restaurants/new" element={<CreateRestaurant />} />
                <Route path="analytics" element={<div style={{ padding: '20px', textAlign: 'center' }}>Analytics page coming soon...</div>} />
                <Route path="settings" element={<div style={{ padding: '20px', textAlign: 'center' }}>Settings page coming soon...</div>} />
                <Route index element={<Navigate to="/admin/restaurants" replace />} />
              </Route>

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

                      {/* Staff Routes (Manager, Cashier, Cook - WITH Navbar, NO Bottom Nav) */}
                      <Route
                        path="/"
                        element={
                          <ProtectedRoute allowedRoles={['manager', 'cashier']}>
                            <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                              <Navbar />
                              <main className="container mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
                                <Orders />
                              </main>
                            </div>
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/dashboard"
                        element={
                          <ProtectedRoute allowedRoles={['manager']}>
                            <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                              <Navbar />
                              <main className="container mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
                                <Dashboard />
                              </main>
                            </div>
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/menu"
                        element={
                          <ProtectedRoute allowedRoles={['manager', 'cashier']}>
                            <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                              <Navbar />
                              <main className="container mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
                                <Menu />
                              </main>
                            </div>
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/orders-history"
                        element={
                          <ProtectedRoute allowedRoles={['manager', 'cashier']}>
                            <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                              <Navbar />
                              <main className="container mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
                                <OrdersHistory />
                              </main>
                            </div>
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
                            <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                              <Navbar />
                              <main className="container mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
                                <Users />
                              </main>
                            </div>
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/profile"
                        element={
                          <ProtectedRoute allowedRoles={['manager', 'cashier', 'cook']}>
                            <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                              <Navbar />
                              <main className="container mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
                                <Profile />
                              </main>
                            </div>
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
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
