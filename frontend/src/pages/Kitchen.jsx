import { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import Toast from '../components/Toast';
import { ordersService } from '../services/firestore';
import { formatMAD } from '../utils/currency';
import { kitchen, status, actions, errors, loading, orders as ordersTranslations, form } from '../utils/translations';
import { createAudioPlayer } from '../utils/audioNotification';
import { ThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

export default function Kitchen() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { user, loading: authLoading, logout } = useAuth();

  const [ordersList, setOrdersList] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState(new Set());

  const audioRef = useRef(null);
  const toastIdCounter = useRef(0);
  const previousOrdersCount = useRef(0);
  const containerRef = useRef(null);

  // Request browser notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        setNotificationPermission(permission);
      });
    } else if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Initialize audio with fallback support
  useEffect(() => {
    audioRef.current = createAudioPlayer('/sounds/kitchen-bell.mp3');
    console.log('🔊 Audio notification system initialized');
  }, []);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (!isSoundMuted && audioRef.current) {
      try {
        audioRef.current.play();
      } catch (error) {
        console.warn('⚠️ Could not play notification sound:', error);
      }
    }
  }, [isSoundMuted]);

  // Fullscreen handlers
  const enterFullscreen = useCallback(() => {
    const elem = containerRef.current;
    if (elem) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
      setIsFullscreen(true);
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
    setIsFullscreen(false);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Logout handlers
  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setShowLogoutDialog(false);
    }
  };

  // Show toast notification
  const showToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = toastIdCounter.current++;
    const newToast = { id, message, type, duration };
    setToasts((prev) => [...prev, newToast]);
  }, []);

  // Remove toast
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Show browser notification
  const showBrowserNotification = useCallback((title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      // Only show if tab is not focused
      if (document.hidden) {
        new Notification(title, {
          body,
          icon: '/logo.png', // Add your logo path
          badge: '/logo.png',
          tag: 'kitchen-order',
          requireInteraction: false
        });
      }
    }
  }, []);

  // Setup Firestore real-time subscription for kitchen orders
  useEffect(() => {
    // Wait for auth to finish loading before subscribing
    if (authLoading) {
      setIsLoading(true);
      return;
    }

    // Don't subscribe if user is not authenticated
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Subscribe to kitchen orders (pending + preparing + ready)
    const unsubscribe = ordersService.subscribeToKitchen((orders) => {
      console.log('🍳 Kitchen orders received:', orders.length, 'orders');

      // Detect new orders and show notification (skip on first load)
      if (previousOrdersCount.current > 0 && orders.length > previousOrdersCount.current) {
        const newOrder = orders[0]; // Newest order is first (ordered by createdAt desc)
        console.log('🔔 New order detected:', newOrder.orderNumber);
        playNotificationSound();
        showToast(
          {
            title: `🔔 Nouvelle Commande: ${newOrder.orderNumber}`,
            body: `${newOrder.itemCount || 0} article(s) • ${formatMAD(newOrder.totalAmount)}`
          },
          'order',
          6000
        );
        showBrowserNotification(
          `Nouvelle Commande: ${newOrder.orderNumber}`,
          `${newOrder.itemCount || 0} article(s) • ${formatMAD(newOrder.totalAmount)}`
        );
      }

      previousOrdersCount.current = orders.length;
      setOrdersList(orders);
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [authLoading, user, playNotificationSound, showToast, showBrowserNotification]);

  async function updateOrderStatus(orderId, newStatus) {
    try {
      await ordersService.updateStatus(orderId, newStatus);
      // Real-time listener will automatically update the orders list
      if (selectedOrder?.id === orderId) {
        const updated = await ordersService.getById(orderId);
        setSelectedOrder(updated);
      }
    } catch (error) {
      alert(errors.updateOrderFailed + ': ' + error.message);
    }
  }

  // Handle completing an order (checks for unpaid status)
  async function handleCompleteOrder(order) {
    // Check if order is unpaid
    if (order.paymentStatus === 'unpaid') {
      // Cooks are BLOCKED from completing unpaid orders
      if (user?.role === 'cook') {
        alert(
          '⚠️ Impossible de terminer cette commande\n\n' +
          'Cette commande n\'a pas été payée. Veuillez contacter un caissier pour traiter le paiement avant de terminer la commande.'
        );
        return; // Do not proceed
      }
      // Other roles: show generic message and block
      alert('⚠️ Cette commande n\'a pas été payée.');
      return;
    }

    // Order is paid, complete it
    await updateOrderStatus(order.id, 'completed');
  }

  async function viewOrderDetails(orderId) {
    try {
      const order = await ordersService.getById(orderId);
      setSelectedOrder(order);
    } catch (error) {
      alert(errors.loadOrdersFailed + ': ' + error.message);
    }
  }

  function getOrdersByStatus(statusValue) {
    return ordersList
      .filter((order) => order.status === statusValue)
      .sort((a, b) => {
        // Sort by oldest first (ascending)
        const aTime = a.createdAt?.getTime() || 0;
        const bTime = b.createdAt?.getTime() || 0;
        return aTime - bTime;
      });
  }

  function getStatusColor(statusValue) {
    const colors = {
      pending: 'border-yellow-300 bg-yellow-50 dark:border-yellow-600 dark:bg-yellow-900',
      preparing: 'border-blue-300 bg-blue-50 dark:border-blue-600 dark:bg-blue-900',
      ready: 'border-green-300 bg-green-50 dark:border-green-600 dark:bg-green-900',
    };
    return colors[statusValue] || 'border-gray-300 bg-gray-50';
  }

  function getStatusLabel(statusValue) {
    return status[statusValue] || statusValue;
  }

  // Calculate order age in minutes
  function getOrderAgeMinutes(createdAt) {
    const now = new Date();
    const created = new Date(createdAt);
    return Math.floor((now - created) / 60000);
  }

  // Get urgency level based on age
  function getOrderUrgency(ageMinutes) {
    if (ageMinutes < 5) return { level: 'normal', color: 'green', label: 'Récent' };
    if (ageMinutes < 10) return { level: 'moderate', color: 'yellow', label: 'À faire' };
    if (ageMinutes < 15) return { level: 'urgent', color: 'orange', label: 'Urgent' };
    return { level: 'critical', color: 'red', label: 'CRITIQUE' };
  }

  // Format order age for display
  function formatOrderAge(createdAt) {
    const ageMinutes = getOrderAgeMinutes(createdAt);
    if (ageMinutes < 1) return "À l'instant";
    if (ageMinutes < 60) return `${ageMinutes} min`;
    const hours = Math.floor(ageMinutes / 60);
    const mins = ageMinutes % 60;
    return `${hours}h${mins > 0 ? mins : ''}`;
  }

  // Toggle order expansion
  function toggleOrderExpansion(orderId) {
    setExpandedOrders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl" style={{ color: 'var(--text-secondary)' }}>
          {loading.loadingKitchen}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        backgroundColor: 'var(--bg-secondary)',
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              onClose={() => removeToast(toast.id)}
            />
          </div>
        ))}
      </div>

      {/* Compact Header - Fixed 48px */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b"
        style={{
          backgroundColor: 'var(--bg-primary)',
          borderColor: 'var(--border-color)',
          height: '48px',
          minHeight: '48px',
          flexShrink: 0
        }}
      >
        {/* Left: Navigation + Title */}
        <div className="flex items-center gap-2">
          {!isFullscreen && (
            <button
              onClick={() => navigate('/')}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              title="Retour"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            🍳 {kitchen.title}
          </h1>
          <div
            className="px-2 py-1 rounded text-sm font-semibold"
            style={{
              backgroundColor: 'var(--status-preparing-bg)',
              color: 'var(--text-primary)'
            }}
          >
            {ordersList.length}
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-1">
          {/* Sound Toggle */}
          <button
            onClick={() => setIsSoundMuted(!isSoundMuted)}
            className="px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-lg"
            style={{ color: 'var(--text-primary)' }}
            title={isSoundMuted ? 'Activer le son' : 'Désactiver le son'}
          >
            {isSoundMuted ? '🔇' : '🔊'}
          </button>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-lg"
            style={{ color: 'var(--text-primary)' }}
            title={theme === 'light' ? 'Mode sombre' : 'Mode clair'}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
            style={{ color: 'var(--text-primary)' }}
            title={isFullscreen ? 'Quitter plein écran' : 'Plein écran'}
          >
            {isFullscreen ? '⊗' : '⛶'}
          </button>
          {/* Logout Button */}
          <button
            onClick={handleLogoutClick}
            className="px-3 py-1 rounded hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
            style={{ color: '#dc2626' }}
            title="Déconnexion"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Order Board - Landscape Tablet-Optimized Layout */}
      <div
        className="overflow-y-auto p-2 md:p-4"
        style={{ flex: 1 }}
      >
        {/* Grid Container for Landscape Tablets - 2-3 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">

          {/* Pending Section */}
          <div className="flex flex-col gap-2">
            <div
              className="sticky top-0 z-10 rounded-lg px-4 py-3 border-l-4"
              style={{
                backgroundColor: 'var(--status-pending-bg)',
                borderColor: 'var(--status-pending-border)',
              }}
            >
              <h2 className="text-lg md:text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                ⏳ {kitchen.pending} <span className="text-base">({getOrdersByStatus('pending').length})</span>
              </h2>
            </div>
          <div className="space-y-3">
            {getOrdersByStatus('pending').map((order) => {
              const ageMinutes = getOrderAgeMinutes(order.createdAt);
              const urgency = getOrderUrgency(ageMinutes);
              const isExpanded = expandedOrders.has(order.id);

              return (
                <div
                  key={order.id}
                  className={`border-3 rounded-xl overflow-hidden transition-all ${
                    urgency.level === 'critical' ? 'animate-pulse' : ''
                  }`}
                  style={{
                    borderColor: urgency.level === 'critical' ? '#ef4444' : urgency.level === 'urgent' ? '#f59e0b' : 'var(--border-color)',
                    backgroundColor: 'var(--bg-primary)',
                    boxShadow: urgency.level === 'critical' ? '0 0 20px rgba(239, 68, 68, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  {/* Card Header - Always Visible */}
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => toggleOrderExpansion(order.id)}
                  >
                    {/* Top Row: Order Number + Age Badge */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl md:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                          {order.notes && <span className="mr-1">📝</span>}
                          {order.orderNumber}
                        </span>
                      </div>
                      <div
                        className="px-3 py-1 rounded-full text-sm font-bold"
                        style={{
                          backgroundColor: urgency.color === 'red' ? '#fee2e2' : urgency.color === 'orange' ? '#fed7aa' : urgency.color === 'yellow' ? '#fef3c7' : '#d1fae5',
                          color: urgency.color === 'red' ? '#dc2626' : urgency.color === 'orange' ? '#ea580c' : urgency.color === 'yellow' ? '#ca8a04' : '#059669'
                        }}
                      >
                        {formatOrderAge(order.createdAt)}
                      </div>
                    </div>

                    {/* Item Count + Customer */}
                    <div className="flex justify-between items-center mb-3">
                      <div className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        {order.itemCount} article{order.itemCount > 1 ? 's' : ''}
                      </div>
                      {order.customerName && (
                        <span className="text-base md:text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>
                          👤 {order.customerName}
                        </span>
                      )}
                    </div>

                    {/* Items Preview (first 3 items) */}
                    <div className="mb-3 space-y-1">
                      {order.items?.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-base md:text-lg" style={{ color: 'var(--text-secondary)' }}>
                          <span className="font-medium">• {item.name}</span>
                          <span className="font-bold text-primary-600">×{item.quantity}</span>
                        </div>
                      ))}
                      {order.items?.length > 3 && (
                        <div className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
                          + {order.items.length - 3} autre{order.items.length - 3 > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>

                    {/* Expand indicator */}
                    <div className="text-center text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                      {isExpanded ? '▲ Masquer détails' : '▼ Voir détails'}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                      {/* All Items */}
                      <div className="mb-4 space-y-2">
                        <h4 className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>Articles complets:</h4>
                        {order.items?.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-lg"
                            style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-bold text-lg md:text-xl" style={{ color: 'var(--text-primary)' }}>
                                  {item.name}
                                </p>
                                {item.category && (
                                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item.category}</p>
                                )}
                                {item.specialInstructions && (
                                  <p className="text-sm mt-1 text-blue-600">📝 {item.specialInstructions}</p>
                                )}
                              </div>
                              <span className="text-2xl font-bold text-primary-600 ml-3">×{item.quantity}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Order Notes */}
                      {order.notes && (
                        <div
                          className="mb-4 p-3 rounded-lg"
                          style={{
                            backgroundColor: '#fff7ed',
                            border: '2px solid #fb923c'
                          }}
                        >
                          <strong style={{ color: '#ea580c' }}>📝 Note commande:</strong>
                          <p style={{ color: '#9a3412', marginTop: '4px' }}>{order.notes}</p>
                        </div>
                      )}

                      {/* Total */}
                      <div className="mb-4 text-xl md:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        Total: <span className="text-primary-600">{formatMAD(order.totalAmount)}</span>
                      </div>
                    </div>
                  )}

                  {/* Action Button - Always Visible */}
                  <div className="p-4 pt-0">
                    <Button
                      size="lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateOrderStatus(order.id, 'preparing');
                      }}
                      className="w-full text-xl md:text-2xl font-bold"
                      style={{ minHeight: '64px', fontSize: '1.25rem' }}
                    >
                      ▶️ {kitchen.startPreparing}
                    </Button>
                  </div>
                </div>
              );
            })}

            {getOrdersByStatus('pending').length === 0 && (
              <p className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
                {kitchen.noPendingOrders}
              </p>
            )}
          </div>
        </div>

        {/* Preparing Section */}
        <div className="flex flex-col gap-2">
          <div
            className="sticky top-0 z-10 rounded-lg px-4 py-3 border-l-4"
            style={{
              backgroundColor: 'var(--status-preparing-bg)',
              borderColor: 'var(--status-preparing-border)',
            }}
          >
            <h2 className="text-lg md:text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              👨‍🍳 {kitchen.preparing} <span className="text-base">({getOrdersByStatus('preparing').length})</span>
            </h2>
          </div>
          <div className="space-y-3">
            {getOrdersByStatus('preparing').map((order) => {
              const ageMinutes = getOrderAgeMinutes(order.createdAt);
              const urgency = getOrderUrgency(ageMinutes);
              const isExpanded = expandedOrders.has(order.id);

              return (
                <div
                  key={order.id}
                  className={`border-3 rounded-xl overflow-hidden transition-all ${
                    urgency.level === 'critical' ? 'animate-pulse' : ''
                  }`}
                  style={{
                    borderColor: urgency.level === 'critical' ? '#ef4444' : urgency.level === 'urgent' ? '#f59e0b' : '#3b82f6',
                    backgroundColor: 'var(--bg-primary)',
                    boxShadow: urgency.level === 'critical' ? '0 0 20px rgba(239, 68, 68, 0.3)' : '0 2px 4px rgba(59, 130, 246, 0.1)'
                  }}
                >
                  <div className="p-4 cursor-pointer" onClick={() => toggleOrderExpansion(order.id)}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl md:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                          {order.notes && <span className="mr-1">📝</span>}
                          {order.orderNumber}
                        </span>
                      </div>
                      <div
                        className="px-3 py-1 rounded-full text-sm font-bold"
                        style={{
                          backgroundColor: urgency.color === 'red' ? '#fee2e2' : urgency.color === 'orange' ? '#fed7aa' : urgency.color === 'yellow' ? '#fef3c7' : '#d1fae5',
                          color: urgency.color === 'red' ? '#dc2626' : urgency.color === 'orange' ? '#ea580c' : urgency.color === 'yellow' ? '#ca8a04' : '#059669'
                        }}
                      >
                        {formatOrderAge(order.createdAt)}
                      </div>
                    </div>

                    <div className="flex justify-between items-center mb-3">
                      <div className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        {order.itemCount} article{order.itemCount > 1 ? 's' : ''}
                      </div>
                      {order.customerName && (
                        <span className="text-base md:text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>
                          👤 {order.customerName}
                        </span>
                      )}
                    </div>

                    <div className="mb-3 space-y-1">
                      {order.items?.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-base md:text-lg" style={{ color: 'var(--text-secondary)' }}>
                          <span className="font-medium">• {item.name}</span>
                          <span className="font-bold text-primary-600">×{item.quantity}</span>
                        </div>
                      ))}
                      {order.items?.length > 3 && (
                        <div className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
                          + {order.items.length - 3} autre{order.items.length - 3 > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>

                    <div className="text-center text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                      {isExpanded ? '▲ Masquer détails' : '▼ Voir détails'}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                      <div className="mb-4 space-y-2">
                        <h4 className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>Articles complets:</h4>
                        {order.items?.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-lg"
                            style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-bold text-lg md:text-xl" style={{ color: 'var(--text-primary)' }}>
                                  {item.name}
                                </p>
                                {item.category && (
                                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item.category}</p>
                                )}
                                {item.specialInstructions && (
                                  <p className="text-sm mt-1 text-blue-600">📝 {item.specialInstructions}</p>
                                )}
                              </div>
                              <span className="text-2xl font-bold text-primary-600 ml-3">×{item.quantity}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      {order.notes && (
                        <div
                          className="mb-4 p-3 rounded-lg"
                          style={{ backgroundColor: '#fff7ed', border: '2px solid #fb923c' }}
                        >
                          <strong style={{ color: '#ea580c' }}>📝 Note commande:</strong>
                          <p style={{ color: '#9a3412', marginTop: '4px' }}>{order.notes}</p>
                        </div>
                      )}
                      <div className="mb-4 text-xl md:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        Total: <span className="text-primary-600">{formatMAD(order.totalAmount)}</span>
                      </div>
                    </div>
                  )}

                  <div className="p-4 pt-0">
                    <Button
                      size="lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateOrderStatus(order.id, 'ready');
                      }}
                      className="w-full text-xl md:text-2xl font-bold"
                      style={{ minHeight: '64px', fontSize: '1.25rem', backgroundColor: '#10b981' }}
                    >
                      ✅ {kitchen.markReady}
                    </Button>
                  </div>
                </div>
              );
            })}

            {getOrdersByStatus('preparing').length === 0 && (
              <p className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
                {kitchen.noPreparingOrders}
              </p>
            )}
          </div>
        </div>

        {/* Ready Section */}
        <div className="flex flex-col gap-2">
          <div
            className="sticky top-0 z-10 rounded-lg px-4 py-3 border-l-4"
            style={{
              backgroundColor: 'var(--status-ready-bg)',
              borderColor: 'var(--status-ready-border)',
            }}
          >
            <h2 className="text-lg md:text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              ✅ {kitchen.ready} <span className="text-base">({getOrdersByStatus('ready').length})</span>
            </h2>
          </div>
          <div className="space-y-3">
            {getOrdersByStatus('ready').map((order) => {
              const ageMinutes = getOrderAgeMinutes(order.createdAt);
              const urgency = getOrderUrgency(ageMinutes);
              const isExpanded = expandedOrders.has(order.id);

              return (
                <div
                  key={order.id}
                  className="border-3 rounded-xl overflow-hidden"
                  style={{
                    borderColor: '#10b981',
                    backgroundColor: 'var(--bg-primary)',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)'
                  }}
                >
                  <div className="p-4 cursor-pointer" onClick={() => toggleOrderExpansion(order.id)}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl md:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                          {order.notes && <span className="mr-1">📝</span>}
                          {order.orderNumber}
                        </span>
                      </div>
                      <div
                        className="px-3 py-1 rounded-full text-sm font-bold"
                        style={{
                          backgroundColor: '#d1fae5',
                          color: '#059669'
                        }}
                      >
                        {formatOrderAge(order.createdAt)}
                      </div>
                    </div>

                    <div className="flex justify-between items-center mb-3">
                      <div className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        {order.itemCount} article{order.itemCount > 1 ? 's' : ''}
                      </div>
                      {order.customerName && (
                        <span className="text-base md:text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>
                          👤 {order.customerName}
                        </span>
                      )}
                    </div>

                    <div className="mb-3 space-y-1">
                      {order.items?.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-base md:text-lg" style={{ color: 'var(--text-secondary)' }}>
                          <span className="font-medium">• {item.name}</span>
                          <span className="font-bold text-primary-600">×{item.quantity}</span>
                        </div>
                      ))}
                      {order.items?.length > 3 && (
                        <div className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
                          + {order.items.length - 3} autre{order.items.length - 3 > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>

                    <div className="text-center text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                      {isExpanded ? '▲ Masquer détails' : '▼ Voir détails'}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                      <div className="mb-4 space-y-2">
                        <h4 className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>Articles complets:</h4>
                        {order.items?.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-lg"
                            style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-bold text-lg md:text-xl" style={{ color: 'var(--text-primary)' }}>
                                  {item.name}
                                </p>
                                {item.category && (
                                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item.category}</p>
                                )}
                                {item.specialInstructions && (
                                  <p className="text-sm mt-1 text-blue-600">📝 {item.specialInstructions}</p>
                                )}
                              </div>
                              <span className="text-2xl font-bold text-primary-600 ml-3">×{item.quantity}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      {order.notes && (
                        <div
                          className="mb-4 p-3 rounded-lg"
                          style={{ backgroundColor: '#fff7ed', border: '2px solid #fb923c' }}
                        >
                          <strong style={{ color: '#ea580c' }}>📝 Note commande:</strong>
                          <p style={{ color: '#9a3412', marginTop: '4px' }}>{order.notes}</p>
                        </div>
                      )}
                      <div className="mb-4 text-xl md:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        Total: <span className="text-primary-600">{formatMAD(order.totalAmount)}</span>
                      </div>
                    </div>
                  )}

                  <div className="p-4 pt-0">
                    <Button
                      size="lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCompleteOrder(order);
                      }}
                      className="w-full text-xl md:text-2xl font-bold"
                      style={{ minHeight: '64px', fontSize: '1.25rem', backgroundColor: '#6366f1' }}
                    >
                      📦 {kitchen.completeOrder}
                    </Button>
                  </div>
                </div>
              );
            })}

            {getOrdersByStatus('ready').length === 0 && (
              <p className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
                {kitchen.noReadyOrders}
              </p>
            )}
          </div>
        </div>

        </div>
      </div>

      {/* Order Details Sidebar */}
      {selectedOrder && (
        <div
          className="fixed inset-y-0 right-0 w-full sm:w-96 p-4 md:p-6 overflow-y-auto z-50 shadow-2xl"
          style={{ backgroundColor: 'var(--bg-primary)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {selectedOrder.orderNumber}
            </h2>
            <button
              onClick={() => setSelectedOrder(null)}
              className="transition-colors"
              style={{ color: 'var(--text-tertiary)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="mb-6">
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                selectedOrder.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : selectedOrder.status === 'preparing'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-green-100 text-green-800'
              }`}
            >
              {getStatusLabel(selectedOrder.status)}
            </span>
          </div>

          {selectedOrder.customerName && (
            <p className="mb-4" style={{ color: 'var(--text-primary)' }}>
              <strong>{ordersTranslations.customer}:</strong> {selectedOrder.customerName}
            </p>
          )}

          {selectedOrder.notes && (
            <div
              className="mb-4 p-3 rounded"
              style={{
                backgroundColor: 'var(--status-pending-bg)',
                border: '1px solid var(--status-pending-border)'
              }}
            >
              <strong style={{ color: 'var(--text-primary)' }}>{form.notes}:</strong>{' '}
              <span style={{ color: 'var(--text-primary)' }}>{selectedOrder.notes}</span>
            </div>
          )}

          <h3 className="font-semibold text-lg mb-3" style={{ color: 'var(--text-primary)' }}>
            {ordersTranslations.items}:
          </h3>
          <div className="space-y-3 mb-6">
            {selectedOrder.items?.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-lg"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div className="flex justify-between items-start mb-1">
                  <p className="font-medium text-lg" style={{ color: 'var(--text-primary)' }}>
                    {item.name}
                  </p>
                  <span className="text-lg font-bold text-primary-600">
                    ×{item.quantity}
                  </span>
                </div>
                {item.category && (
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {item.category}
                  </p>
                )}
                {item.specialInstructions && (
                  <p className="text-sm text-blue-600 mt-2">
                    {form.notes}: {item.specialInstructions}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
            <div className="flex justify-between items-center mb-4">
              <span className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                {ordersTranslations.total}:
              </span>
              <span className="text-2xl font-bold text-primary-600">
                {formatMAD(selectedOrder.totalAmount)}
              </span>
            </div>

            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              {kitchen.created}: {new Date(selectedOrder.createdAt).toLocaleString('fr-FR')}
            </p>
          </div>
        </div>
      )}

      {/* Backdrop for sidebar */}
      {selectedOrder && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40"
          onClick={() => setSelectedOrder(null)}
        />
      )}

      {/* Logout Confirmation Dialog */}
      {showLogoutDialog && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-100"
            onClick={() => setShowLogoutDialog(false)}
          />
          <div
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-6 rounded-lg shadow-2xl z-100"
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--border-color)',
              border: '1px solid',
              minWidth: '320px',
              maxWidth: '400px'
            }}
          >
            <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
              Confirmer la déconnexion
            </h3>
            <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
              Êtes-vous sûr de vouloir vous déconnecter ?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowLogoutDialog(false)}
                className="px-4 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                style={{ color: 'var(--text-primary)' }}
              >
                Annuler
              </button>
              <button
                onClick={handleLogoutConfirm}
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
