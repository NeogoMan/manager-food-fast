import { useState, useEffect } from 'react';
import Button from '../components/Button';
import Card from '../components/Card';
import Modal from '../components/Modal';
import { ordersService, usersService } from '../services/firestore';
import { formatMAD } from '../utils/currency';
import { orders, status, actions, form, loading, ui } from '../utils/translations';
import { useAuth } from '../contexts/AuthContext';

export default function OrdersHistory() {
  const { user } = useAuth();
  const [ordersList, setOrdersList] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [usersMap, setUsersMap] = useState({});

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 20;

  // Setup real-time listener for completed and cancelled orders
  useEffect(() => {
    // Don't subscribe if user is not authenticated yet
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const unsubscribe = ordersService.subscribe((orders) => {
      // Filter for completed and cancelled orders only
      const historyOrders = orders.filter((order) =>
        ['completed', 'cancelled'].includes(order.status)
      );
      setOrdersList(historyOrders);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Load users for displaying client names
  useEffect(() => {
    // Don't load users if not authenticated yet
    if (!user) {
      return;
    }

    async function loadUsers() {
      try {
        const users = await usersService.getAll();
        const map = {};
        users.forEach((u) => {
          map[u.id] = u;
        });
        setUsersMap(map);
      } catch (error) {
        console.error('Failed to load users:', error);
      }
    }
    loadUsers();
  }, []);

  // Apply filters whenever ordersList or filter states change
  useEffect(() => {
    let filtered = [...ordersList];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Payment filter
    if (paymentFilter !== 'all') {
      filtered = filtered.filter((order) => order.paymentStatus === paymentFilter);
    }

    // Search filter (order number or customer name)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((order) => {
        const orderNumber = order.orderNumber?.toLowerCase() || '';
        const customerName = getClientName(order).toLowerCase();
        return orderNumber.includes(query) || customerName.includes(query);
      });
    }

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filtered = filtered.filter((order) => {
        const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);

        switch (dateRange) {
          case 'today':
            return orderDate >= todayStart;

          case 'yesterday': {
            const yesterdayStart = new Date(todayStart);
            yesterdayStart.setDate(yesterdayStart.getDate() - 1);
            const yesterdayEnd = new Date(todayStart);
            return orderDate >= yesterdayStart && orderDate < yesterdayEnd;
          }

          case 'thisWeek': {
            const weekStart = new Date(todayStart);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            return orderDate >= weekStart;
          }

          case 'thisMonth': {
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            return orderDate >= monthStart;
          }

          case 'lastMonth': {
            const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);
            return orderDate >= lastMonthStart && orderDate < lastMonthEnd;
          }

          case 'custom': {
            if (customStartDate && customEndDate) {
              const startDate = new Date(customStartDate);
              const endDate = new Date(customEndDate);
              endDate.setHours(23, 59, 59, 999);
              return orderDate >= startDate && orderDate <= endDate;
            }
            return true;
          }

          default:
            return true;
        }
      });
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => {
      const aTime = a.updatedAt?.getTime() || a.createdAt?.getTime() || 0;
      const bTime = b.updatedAt?.getTime() || b.createdAt?.getTime() || 0;
      return bTime - aTime;
    });

    setFilteredOrders(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [ordersList, searchQuery, statusFilter, paymentFilter, dateRange, customStartDate, customEndDate]);

  // Get client name (registered user or walk-in customer)
  function getClientName(order) {
    if (order.userId && usersMap[order.userId]) {
      return usersMap[order.userId].name || usersMap[order.userId].username;
    }
    return order.customerName || 'Client';
  }

  async function viewOrderDetails(orderId) {
    try {
      const order = await ordersService.getById(orderId);
      setSelectedOrder(order);
    } catch (error) {
      alert('Erreur lors du chargement de la commande: ' + error.message);
    }
  }

  function getStatusColor(statusValue) {
    const colors = {
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[statusValue] || 'bg-gray-100 text-gray-800';
  }

  function getStatusLabel(statusValue) {
    return status[statusValue] || statusValue;
  }

  function formatOrderDate(date) {
    if (!date) return '';

    const orderDate = date?.toDate ? date.toDate() : new Date(date);
    const now = new Date();
    const diffMs = now - orderDate;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Show relative time for recent orders
    if (diffDays === 0) {
      return orderDate.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffDays === 1) {
      return 'Hier ' + orderDate.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      // Show absolute date for older orders
      return orderDate.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  }

  // Pagination
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl" style={{ color: 'var(--text-secondary)' }}>
          {loading.loadingOrders}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          {orders.orderHistory}
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Consultez l'historique complet des commandes terminées et annulées
        </p>
      </div>

      {/* Filters Section */}
      <Card className="mb-6">
        <div className="space-y-4">
          {/* Search Bar */}
          <div>
            <label className="label">Rechercher une commande</label>
            <input
              type="text"
              className="input"
              placeholder="Numéro de commande ou nom du client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <label className="label">Statut</label>
              <select
                className="input"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Tous les statuts</option>
                <option value="completed">{status.completed}</option>
                <option value="cancelled">{status.cancelled}</option>
              </select>
            </div>

            {/* Payment Filter */}
            <div>
              <label className="label">Paiement</label>
              <select
                className="input"
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
              >
                <option value="all">Tous</option>
                <option value="paid">Payé</option>
                <option value="unpaid">Non payé</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="label">Période</label>
              <select
                className="input"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="all">Toutes les dates</option>
                <option value="today">Aujourd'hui</option>
                <option value="yesterday">Hier</option>
                <option value="thisWeek">Cette semaine</option>
                <option value="thisMonth">Ce mois</option>
                <option value="lastMonth">Mois dernier</option>
                <option value="custom">Personnalisé</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="flex items-end">
              <div
                className="px-4 py-2 rounded-lg w-full text-center"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  {filteredOrders.length}
                </span>
                <span className="text-sm ml-2" style={{ color: 'var(--text-secondary)' }}>
                  commande(s) trouvée(s)
                </span>
              </div>
            </div>
          </div>

          {/* Custom Date Range */}
          {dateRange === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="label">Date de début</label>
                <input
                  type="date"
                  className="input"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Date de fin</label>
                <input
                  type="date"
                  className="input"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Clear Filters Button */}
          {(searchQuery || statusFilter !== 'all' || paymentFilter !== 'all' || dateRange !== 'all') && (
            <div className="flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setPaymentFilter('all');
                  setDateRange('all');
                  setCustomStartDate('');
                  setCustomEndDate('');
                }}
              >
                Réinitialiser les filtres
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Orders List */}
      {currentOrders.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Aucune commande trouvée
            </p>
            <p style={{ color: 'var(--text-secondary)' }}>
              Aucune commande ne correspond à vos critères de recherche
            </p>
          </div>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {currentOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Order Info */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Order Number & Status */}
                    <div>
                      <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                        Numéro de commande
                      </p>
                      <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                        {order.orderNumber}
                      </p>
                      <div className="flex gap-2 mt-1">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {getStatusLabel(order.status)}
                        </span>
                        {/* Payment Status Badge */}
                        {order.paymentStatus === 'paid' ? (
                          <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ Payé
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            ❌ Non payé
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Client Name */}
                    <div>
                      <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                        Client
                      </p>
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {getClientName(order)}
                      </p>
                    </div>

                    {/* Date & Time */}
                    <div>
                      <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                        Date
                      </p>
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {formatOrderDate(order.createdAt)}
                      </p>
                    </div>

                    {/* Total & Items */}
                    <div>
                      <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                        Total
                      </p>
                      <p className="font-bold text-lg text-primary-600">
                        {formatMAD(order.totalAmount)}
                      </p>
                      <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                        {order.itemCount} article(s)
                      </p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex items-center">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => viewOrderDetails(order.id)}
                    >
                      {actions.view}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                ← Précédent
              </Button>

              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    // Show first page, last page, current page, and pages around current
                    return (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    );
                  })
                  .map((page, index, array) => {
                    // Add ellipsis if there's a gap
                    const prevPage = array[index - 1];
                    const showEllipsis = prevPage && page - prevPage > 1;

                    return (
                      <div key={page} className="flex items-center gap-1">
                        {showEllipsis && (
                          <span style={{ color: 'var(--text-tertiary)' }}>...</span>
                        )}
                        <button
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                            currentPage === page
                              ? 'bg-primary-600 text-white'
                              : ''
                          }`}
                          style={
                            currentPage !== page
                              ? {
                                  backgroundColor: 'var(--bg-tertiary)',
                                  color: 'var(--text-primary)',
                                }
                              : {}
                          }
                        >
                          {page}
                        </button>
                      </div>
                    );
                  })}
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Suivant →
              </Button>
            </div>
          )}
        </>
      )}

      {/* Order Details Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`${orders.orderNumber} ${selectedOrder?.orderNumber || ''}`}
      >
        {selectedOrder && (
          <div>
            <div className="mb-4 flex gap-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  selectedOrder.status
                )}`}
              >
                {getStatusLabel(selectedOrder.status)}
              </span>
              {/* Payment Status Badge */}
              {selectedOrder.paymentStatus === 'paid' ? (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  ✓ Payé
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                  ❌ Non payé
                </span>
              )}
            </div>

            {/* Payment Details (if paid) */}
            {selectedOrder.paymentStatus === 'paid' && (
              <div
                className="mb-4 p-3 rounded-lg"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  borderLeft: '4px solid #10b981',
                }}
              >
                <p className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  💰 Détails du paiement
                </p>
                <div className="space-y-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {selectedOrder.paymentMethod && (
                    <p>
                      <strong>Méthode:</strong> {selectedOrder.paymentMethod === 'cash' ? 'Espèces' : selectedOrder.paymentMethod}
                    </p>
                  )}
                  {selectedOrder.paymentAmount && (
                    <p>
                      <strong>Montant reçu:</strong> {formatMAD(selectedOrder.paymentAmount)}
                    </p>
                  )}
                  {selectedOrder.changeGiven !== undefined && selectedOrder.changeGiven !== null && (
                    <p>
                      <strong>Monnaie rendue:</strong> {formatMAD(selectedOrder.changeGiven)}
                    </p>
                  )}
                  {selectedOrder.paymentTime && (
                    <p>
                      <strong>Heure du paiement:</strong>{' '}
                      {selectedOrder.paymentTime?.toDate
                        ? selectedOrder.paymentTime.toDate().toLocaleString('fr-FR')
                        : new Date(selectedOrder.paymentTime).toLocaleString('fr-FR')}
                    </p>
                  )}
                </div>
              </div>
            )}

            {selectedOrder.customerName && (
              <p className="mb-2" style={{ color: 'var(--text-primary)' }}>
                <strong>{orders.customer}:</strong> {selectedOrder.customerName}
              </p>
            )}

            <p className="mb-2" style={{ color: 'var(--text-primary)' }}>
              <strong>Date:</strong> {formatOrderDate(selectedOrder.createdAt)}
            </p>

            {selectedOrder.notes && (
              <p className="mb-4" style={{ color: 'var(--text-primary)' }}>
                <strong>{form.notes}:</strong> {selectedOrder.notes}
              </p>
            )}

            <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              {orders.items}:
            </h3>
            <div className="space-y-2 mb-4">
              {selectedOrder.items?.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between py-2"
                  style={{ borderBottom: '1px solid var(--border-color)' }}
                >
                  <div>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {item.name}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      {form.quantity}: {item.quantity} × {formatMAD(item.unitPrice)}
                    </p>
                  </div>
                  <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                    {formatMAD(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)' }} className="pt-3">
              <div className="flex justify-between items-center">
                <span className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {orders.total}:
                </span>
                <span className="text-2xl font-bold text-primary-600">
                  {formatMAD(selectedOrder.totalAmount)}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
