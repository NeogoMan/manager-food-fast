import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ordersService } from '../services/firestore';
import { client, orders, status, actions } from '../utils/translations';
import Button from '../components/Button';
import Toast from '../components/Toast';

export default function MyOrders() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ordersList, setOrdersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  // Setup real-time subscription for client's orders
  useEffect(() => {
    if (!user?.id) return;

    setLoading(true);

    // Subscribe to orders filtered by userId (client's own orders)
    const unsubscribe = ordersService.subscribe((orders) => {
      setOrdersList(orders);
      setLoading(false);
    }, { userId: user.id });

    return () => unsubscribe();
  }, [user?.id]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const handleCloseToast = () => {
    setToast({ show: false, message: '', type: '' });
  };

  const getStatusBadge = (orderStatus) => {
    const badges = {
      awaiting_approval: { bg: '#fef3c7', color: '#92400e', label: status.awaiting_approval },
      rejected: { bg: '#fee2e2', color: '#991b1b', label: status.rejected },
      pending: { bg: '#dbeafe', color: '#1e40af', label: status.pending },
      preparing: { bg: '#dbeafe', color: '#1e3a8a', label: status.preparing },
      ready: { bg: '#d1fae5', color: '#065f46', label: status.ready },
      completed: { bg: '#e5e7eb', color: '#374151', label: status.completed },
      cancelled: { bg: '#fee2e2', color: '#991b1b', label: status.cancelled },
    };
    const badge = badges[orderStatus] || badges.awaiting_approval;

    return (
      <span
        className="px-4 py-2 rounded-full text-sm md:text-base font-bold whitespace-nowrap"
        style={{ backgroundColor: badge.bg, color: badge.color }}
      >
        {badge.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getStatusIcon = (orderStatus) => {
    const icons = {
      awaiting_approval: '🔔',
      rejected: '❌',
      pending: '⏳',
      preparing: '👨‍🍳',
      ready: '✅',
      completed: '📦',
      cancelled: '❌',
    };
    return icons[orderStatus] || '📋';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div style={{ color: 'var(--text-primary)' }}>
          Chargement des commandes...
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <h1 className="heading-1" style={{ color: 'var(--text-primary)' }}>
          {client.myOrders}
        </h1>
        <p className="mt-2 text-sm md:text-base" style={{ color: 'var(--text-secondary)' }}>
          Suivez l'état de vos commandes en temps réel
        </p>
      </div>

      {/* Orders List */}
      {ordersList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="text-8xl mb-4">📋</div>
          <h2
            className="text-2xl font-bold mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            Aucune commande
          </h2>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            Vous n'avez pas encore passé de commande
          </p>
          <Button onClick={() => navigate('/customer-menu')}>
            {client.viewMenu}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {ordersList.map((order) => (
            <div
              key={order.id}
              className="rounded-xl p-5 md:p-6 cursor-pointer transition-all duration-200 active:scale-[0.99] md:hover:shadow-lg"
              style={{
                backgroundColor: 'var(--bg-primary)',
                border: '2px solid var(--border)',
              }}
              onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
            >
              {/* Order Header */}
              <div className="flex items-start justify-between gap-3 mb-5">
                <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                  <span className="text-3xl sm:text-4xl mt-1 flex-shrink-0">{getStatusIcon(order.status)}</span>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-lg sm:text-xl md:text-2xl font-bold mb-1 truncate"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      #{order.orderNumber}
                    </h3>
                    <p
                      className="text-xs sm:text-sm md:text-base font-medium"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  {getStatusBadge(order.status)}
                  <p
                    className="text-lg sm:text-xl md:text-2xl font-bold whitespace-nowrap"
                    style={{ color: 'var(--primary)' }}
                  >
                    {order.totalAmount.toFixed(2)} MAD
                  </p>
                </div>
              </div>

              {/* Order Items Preview */}
              <div className="mb-4 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <p className="text-sm md:text-base font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {order.items.length} article{order.items.length > 1 ? 's' : ''}
                  {' • '}
                  {order.items.reduce((sum, item) => sum + item.quantity, 0)} unité
                  {order.items.reduce((sum, item) => sum + item.quantity, 0) > 1 ? 's' : ''}
                </p>
              </div>

              {/* Expanded Details */}
              {selectedOrder?.id === order.id && (
                <div className="space-y-4 animate-fadeIn">
                  <h4 className="text-base font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                    Détails de la commande
                  </h4>
                  <div className="space-y-4">
                    {order.items.map((item, index) => (
                      <div
                        key={index}
                        className="p-4 rounded-lg"
                        style={{ backgroundColor: 'var(--bg-secondary)' }}
                      >
                        <div className="flex justify-between items-start gap-3 mb-2">
                          <div className="flex-1">
                            <p className="text-sm sm:text-base md:text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                              {item.quantity}x {item.name}
                            </p>
                            {item.notes && (
                              <p
                                className="text-xs sm:text-sm md:text-base mt-2 p-2 rounded"
                                style={{
                                  color: 'var(--text-secondary)',
                                  backgroundColor: 'var(--bg-primary)',
                                }}
                              >
                                💬 {item.notes}
                              </p>
                            )}
                          </div>
                          <p className="text-base sm:text-lg font-bold whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                            {(item.price * item.quantity).toFixed(2)} MAD
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div
                    className="pt-4 mt-4 border-t-2 flex justify-between items-center"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <span
                      className="text-base sm:text-lg md:text-xl font-bold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Total
                    </span>
                    <span
                      className="text-xl sm:text-2xl font-bold"
                      style={{ color: 'var(--primary)' }}
                    >
                      {order.totalAmount.toFixed(2)} MAD
                    </span>
                  </div>
                </div>
              )}

              {/* Status Progress - Vertical Timeline */}
              {order.status !== 'cancelled' && order.status !== 'completed' &&
               order.status !== 'awaiting_approval' && order.status !== 'rejected' && (
                <div
                  className="mt-6 pt-6 border-t"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <h4 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                    Progression de la commande
                  </h4>
                  <div className="space-y-4 relative pl-8">
                    {/* Vertical Line */}
                    <div
                      className="absolute left-[19px] top-0 bottom-0 w-0.5"
                      style={{ backgroundColor: 'var(--border)' }}
                    />

                    {/* Step 1: En attente */}
                    <div className="relative flex items-start gap-4">
                      <div
                        className={`absolute -left-8 w-10 h-10 rounded-full flex items-center justify-center text-2xl transition-all duration-300 z-10 ${
                          order.status === 'pending' ? 'ring-4' : ''
                        }`}
                        style={{
                          backgroundColor: order.status === 'pending' ? 'var(--primary)' : 'var(--bg-secondary)',
                          ringColor: order.status === 'pending' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                        }}
                      >
                        <span style={{ filter: order.status === 'pending' ? 'none' : 'grayscale(100%)' }}>⏳</span>
                      </div>
                      <div className="flex-1 pt-1">
                        <p
                          className={`text-base font-semibold ${order.status === 'pending' ? 'text-lg' : ''}`}
                          style={{ color: order.status === 'pending' ? 'var(--primary)' : 'var(--text-secondary)' }}
                        >
                          En attente
                        </p>
                        {order.status === 'pending' && (
                          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                            Votre commande est en attente de préparation
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Step 2: En préparation */}
                    <div className="relative flex items-start gap-4">
                      <div
                        className={`absolute -left-8 w-10 h-10 rounded-full flex items-center justify-center text-2xl transition-all duration-300 z-10 ${
                          order.status === 'preparing' ? 'ring-4' : ''
                        }`}
                        style={{
                          backgroundColor: order.status === 'preparing' ? 'var(--primary)' : 'var(--bg-secondary)',
                          ringColor: order.status === 'preparing' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                        }}
                      >
                        <span style={{ filter: order.status === 'preparing' ? 'none' : 'grayscale(100%)' }}>👨‍🍳</span>
                      </div>
                      <div className="flex-1 pt-1">
                        <p
                          className={`text-base font-semibold ${order.status === 'preparing' ? 'text-lg' : ''}`}
                          style={{ color: order.status === 'preparing' ? 'var(--primary)' : 'var(--text-secondary)' }}
                        >
                          En préparation
                        </p>
                        {order.status === 'preparing' && (
                          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                            Votre commande est en cours de préparation
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Step 3: Prête */}
                    <div className="relative flex items-start gap-4">
                      <div
                        className={`absolute -left-8 w-10 h-10 rounded-full flex items-center justify-center text-2xl transition-all duration-300 z-10 ${
                          order.status === 'ready' ? 'ring-4' : ''
                        }`}
                        style={{
                          backgroundColor: order.status === 'ready' ? '#10b981' : 'var(--bg-secondary)',
                          ringColor: order.status === 'ready' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                        }}
                      >
                        <span style={{ filter: order.status === 'ready' ? 'none' : 'grayscale(100%)' }}>✅</span>
                      </div>
                      <div className="flex-1 pt-1">
                        <p
                          className={`text-base font-semibold ${order.status === 'ready' ? 'text-lg' : ''}`}
                          style={{ color: order.status === 'ready' ? '#10b981' : 'var(--text-secondary)' }}
                        >
                          Prête
                        </p>
                        {order.status === 'ready' && (
                          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                            Votre commande est prête à être récupérée
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Toast Notifications */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={handleCloseToast}
      />
    </div>
  );
}
