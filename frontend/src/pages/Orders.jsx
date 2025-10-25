import { useState, useEffect, useCallback, useRef } from 'react';
import Button from '../components/Button';
import Card from '../components/Card';
import Modal from '../components/Modal';
import ApprovalNotification from '../components/ApprovalNotification';
import PrinterConnection from '../components/PrinterConnection';
import PrinterStatus from '../components/PrinterStatus';
import { menuService, ordersService, usersService } from '../services/firestore';
import { formatMAD } from '../utils/currency';
import { orders, status, actions, form, errors, loading, approval } from '../utils/translations';
import { useAuth } from '../contexts/AuthContext';
import printerService from '../services/printerService';

export default function Orders() {
  const { user, loading: authLoading } = useAuth();
  const [ordersList, setOrdersList] = useState([]);
  const [pendingApprovalOrders, setPendingApprovalOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Print modal state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [orderToPrint, setOrderToPrint] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printerConnected, setPrinterConnected] = useState(false);

  // Payment modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [orderForPayment, setOrderForPayment] = useState(null);
  const [amountReceived, setAmountReceived] = useState('');
  const [calculatedChange, setCalculatedChange] = useState(0);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Print confirmation modal state
  const [isPrintConfirmModalOpen, setIsPrintConfirmModalOpen] = useState(false);
  const [orderToPrintConfirm, setOrderToPrintConfirm] = useState(null);

  // Unpaid warning modal state
  const [showUnpaidWarningModal, setShowUnpaidWarningModal] = useState(false);
  const [orderToCompleteUnpaid, setOrderToCompleteUnpaid] = useState(null);

  // User data for showing client names
  const [usersMap, setUsersMap] = useState({});

  // Track highlighted orders (for update animation)
  const [highlightedOrders, setHighlightedOrders] = useState(new Set());
  const previousOrdersRef = useRef({});

  // Status filter state
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Order form state
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [orderItems, setOrderItems] = useState([]);

  // Setup real-time listeners for orders
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

    // Subscribe to orders with role-based filtering
    // Clients only see their own orders, staff see all orders
    const subscriptionFilter = user?.role === 'client' ? { userId: user.id } : {};

    const unsubscribeOrders = ordersService.subscribe((orders) => {
      setOrdersList(orders);
      setIsLoading(false);
    }, subscriptionFilter);

    // Subscribe to pending approval orders (for staff)
    let unsubscribeApproval;
    if (user?.role === 'manager' || user?.role === 'cashier') {
      unsubscribeApproval = ordersService.subscribe((orders) => {
        const pending = orders.filter(o => o.status === 'awaiting_approval');
        setPendingApprovalOrders(pending);
      }, { status: 'awaiting_approval' });
    }

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribeOrders();
      if (unsubscribeApproval) {
        unsubscribeApproval();
      }
    };
  }, [authLoading, user?.role, user?.id]);

  // Load menu items once (no real-time needed)
  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading || !user) {
      return;
    }

    async function loadMenuItems() {
      try {
        const data = await menuService.getAvailable();
        setMenuItems(data);
      } catch (error) {
        console.error(errors.loadMenuFailed + ':', error);
      }
    }
    loadMenuItems();
  }, [authLoading, user]);

  // Load users for displaying client names
  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading || !user) {
      return;
    }

    async function loadUsers() {
      try {
        const users = await usersService.getAll();
        const map = {};
        users.forEach(u => {
          map[u.id] = u;
        });
        setUsersMap(map);
      } catch (error) {
        console.error('Failed to load users:', error);
      }
    }
    loadUsers();
  }, [authLoading, user]);

  // Check printer status on mount and update periodically
  useEffect(() => {
    const checkPrinterStatus = () => {
      const connected = printerService.getConnectionStatus();
      setPrinterConnected(connected);
    };

    checkPrinterStatus();
    const interval = setInterval(checkPrinterStatus, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Detect order updates for highlighting animation
  useEffect(() => {
    const newHighlighted = new Set();

    ordersList.forEach(order => {
      const previousOrder = previousOrdersRef.current[order.id];

      // Check if this order was updated (status changed or updatedAt changed)
      if (previousOrder && order.updatedAt) {
        const prevTime = previousOrder.updatedAt?.getTime() || 0;
        const currentTime = order.updatedAt?.getTime() || 0;

        if (currentTime > prevTime) {
          newHighlighted.add(order.id);

          // Remove highlight after 3 seconds
          setTimeout(() => {
            setHighlightedOrders(prev => {
              const next = new Set(prev);
              next.delete(order.id);
              return next;
            });
          }, 3000);
        }
      }
    });

    // Update previous orders reference
    const newPrevious = {};
    ordersList.forEach(order => {
      newPrevious[order.id] = {
        id: order.id,
        status: order.status,
        updatedAt: order.updatedAt,
      };
    });
    previousOrdersRef.current = newPrevious;

    if (newHighlighted.size > 0) {
      setHighlightedOrders(prev => new Set([...prev, ...newHighlighted]));
    }
  }, [ordersList]);

  // Update selected order in real-time when orders list changes
  useEffect(() => {
    if (selectedOrder) {
      const updatedOrder = ordersList.find(o => o.id === selectedOrder.id);
      if (updatedOrder) {
        setSelectedOrder(updatedOrder);
      }
    }
  }, [ordersList]);

  function openCreateModal() {
    setCustomerName('');
    setNotes('');
    setOrderItems([]);
    setIsCreateModalOpen(true);
  }

  function addItemToOrder(menuItem) {
    const existingIndex = orderItems.findIndex(
      (item) => item.menu_item_id === menuItem.id
    );

    if (existingIndex >= 0) {
      const newItems = [...orderItems];
      newItems[existingIndex].quantity += 1;
      setOrderItems(newItems);
    } else {
      setOrderItems([
        ...orderItems,
        {
          menu_item_id: menuItem.id,
          name: menuItem.name,
          price: menuItem.price,
          quantity: 1,
        },
      ]);
    }
  }

  function removeItemFromOrder(index) {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  }

  function updateQuantity(index, newQuantity) {
    if (newQuantity < 1) return;
    const newItems = [...orderItems];
    newItems[index].quantity = newQuantity;
    setOrderItems(newItems);
  }

  function calculateTotal() {
    return orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  async function handleCreateOrder(e) {
    e.preventDefault();

    if (orderItems.length === 0) {
      alert(errors.orderMustHaveItems);
      return;
    }

    try {
      // Determine initial status based on user role
      // Staff orders go directly to 'pending', client orders need approval
      const initialStatus = (user?.role === 'manager' || user?.role === 'cashier')
        ? 'pending'
        : 'awaiting_approval';

      const orderUserId = user?.role === 'client' ? user.id : null;

      // Create the order and capture the returned order data
      const createdOrder = await ordersService.create({
        userId: orderUserId, // Set userId for clients, null for walk-in customers
        customerName: customerName || null,
        notes: notes || null,
        items: orderItems.map((item) => ({
          menuItemId: item.menu_item_id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        totalAmount: calculateTotal(),
        itemCount: orderItems.reduce((sum, item) => sum + item.quantity, 0),
        status: initialStatus, // Pass the initial status
      });

      setIsCreateModalOpen(false);
      // Real-time listener will automatically update the list

      // Open payment modal for staff after creating order
      if (user?.role === 'manager' || user?.role === 'cashier') {
        // Small delay to ensure order is in the list
        setTimeout(() => {
          openPaymentModal(createdOrder.id);
        }, 500);
      }
    } catch (error) {
      console.error('Order creation failed:', error);
      alert(errors.createOrderFailed + ': ' + error.message);
    }
  }

  async function updateOrderStatus(orderId, newStatus) {
    try {
      await ordersService.updateStatus(orderId, newStatus);
      // Real-time listener will automatically update the list
    } catch (error) {
      alert(errors.updateOrderFailed + ': ' + error.message);
    }
  }

  async function viewOrderDetails(orderId) {
    try {
      const order = await ordersService.getById(orderId);
      setSelectedOrder(order);
    } catch (error) {
      alert(errors.loadOrdersFailed + ': ' + error.message);
    }
  }

  async function handleApprove(orderId) {
    try {
      // 1. Approve the order first
      await ordersService.approve(orderId);
      // Real-time listener will automatically update both lists

      // 2. Try to print the order ticket (non-blocking)
      try {
        // Get the approved order details
        const approvedOrder = await ordersService.getById(orderId);

        // Check if printer is available
        if (printerService.getConnectionStatus()) {
          // Prepare ticket data
          const clientName = approvedOrder.userId && usersMap[approvedOrder.userId]
            ? usersMap[approvedOrder.userId].name || usersMap[approvedOrder.userId].username
            : approvedOrder.customerName || 'Client';

          const additionalData = {
            cashierName: user?.name || user?.username || 'Caissier',
            clientName: clientName,
          };

          // Print the ticket
          await printerService.printOrderTicket(approvedOrder, additionalData);

          // Success: both approved and printed
          alert('✓ Commande approuvée et ticket imprimé avec succès!');
        } else {
          // USB printer not connected - order still approved
          alert('✓ Commande approuvée\n⚠️ Imprimante USB non connectée - Ticket non imprimé\n\nConnectez l\'imprimante pour imprimer les prochaines commandes.');
        }
      } catch (printError) {
        // Print failed but order is still approved
        console.error('Print error:', printError);
        alert('✓ Commande approuvée\n⚠️ Erreur d\'impression: ' + printError.message + '\n\nVérifiez la connexion de l\'imprimante.');
      }
    } catch (error) {
      // Order approval failed
      alert('Erreur lors de l\'approbation: ' + error.message);
    }
  }

  async function handleReject(orderId) {
    try {
      const reason = prompt('Raison du refus (optionnel):');
      await ordersService.reject(orderId, reason);
      // Real-time listener will automatically update both lists
    } catch (error) {
      alert('Erreur lors du refus: ' + error.message);
    }
  }

  // Open print confirmation modal for an order
  async function openPrintModal(orderId) {
    try {
      const order = await ordersService.getById(orderId);
      setOrderToPrintConfirm(order);
      setIsPrintConfirmModalOpen(true);
    } catch (error) {
      alert('Erreur lors du chargement de la commande: ' + error.message);
    }
  }

  // Execute print operation
  async function executePrint() {
    if (!orderToPrint) return;

    setIsPrinting(true);
    try {
      // Check printer availability
      if (!printerService.getConnectionStatus()) {
        alert('⚠️ Imprimante USB non connectée.\n\nVeuillez connecter l\'imprimante pour imprimer les tickets.');
        setIsPrinting(false);
        return;
      }

      // Prepare ticket data
      const clientName = orderToPrint.userId && usersMap[orderToPrint.userId]
        ? usersMap[orderToPrint.userId].name || usersMap[orderToPrint.userId].username
        : orderToPrint.customerName || 'Client';

      const additionalData = {
        cashierName: user?.name || user?.username || 'Caissier',
        clientName: clientName,
      };

      // Print the ticket
      await printerService.printOrderTicket(orderToPrint, additionalData);

      // Success
      alert('✓ Ticket imprimé avec succès!');
      setIsPrintModalOpen(false);
      setOrderToPrint(null);
    } catch (printError) {
      console.error('Print error:', printError);
      alert('⚠️ Erreur d\'impression: ' + printError.message + '\n\nVérifiez la connexion de l\'imprimante.');
    } finally {
      setIsPrinting(false);
    }
  }

  // Open payment modal for an order
  async function openPaymentModal(orderId) {
    try {
      const order = await ordersService.getById(orderId);
      setOrderForPayment(order);
      setAmountReceived('');
      setCalculatedChange(0);
      setIsPaymentModalOpen(true);
    } catch (error) {
      alert('Erreur lors du chargement de la commande: ' + error.message);
    }
  }

  // Handle amount input change
  function handleAmountChange(value) {
    setAmountReceived(value);

    if (orderForPayment && value) {
      const amount = parseFloat(value);
      const change = amount - orderForPayment.totalAmount;
      setCalculatedChange(change);
    } else {
      setCalculatedChange(0);
    }
  }

  // Handle calculator keypad click
  function handleKeypadClick(key) {
    if (!orderForPayment) return;

    let newValue = amountReceived;

    if (key === 'C') {
      // Clear
      newValue = '';
    } else if (key === '⌫') {
      // Backspace
      newValue = amountReceived.slice(0, -1);
    } else if (key === '.') {
      // Decimal point - only allow one
      if (!amountReceived.includes('.')) {
        newValue = amountReceived + '.';
      }
    } else {
      // Number key
      // Prevent multiple leading zeros
      if (amountReceived === '0' && key !== '.') {
        newValue = key;
      } else {
        newValue = amountReceived + key;
      }
    }

    handleAmountChange(newValue);
  }

  // Quick bill button click
  function handleQuickBill(amount) {
    if (!orderForPayment) return;
    handleAmountChange(amount.toString());
  }

  // Process payment
  async function processPayment() {
    if (!orderForPayment) return;

    const amount = parseFloat(amountReceived);

    // Validate amount
    if (!amount || amount < orderForPayment.totalAmount) {
      alert('⚠️ Le montant reçu doit être supérieur ou égal au total de la commande.');
      return;
    }

    setIsProcessingPayment(true);
    try {
      const change = amount - orderForPayment.totalAmount;

      // Record payment in database
      await ordersService.recordPayment(orderForPayment.id, {
        amount: amount,
        change: change,
        method: 'cash',
      });

      // Close payment modal
      setIsPaymentModalOpen(false);
      setAmountReceived('');
      setCalculatedChange(0);

      // Get updated order with payment info
      const updatedOrder = await ordersService.getById(orderForPayment.id);

      // Show print confirmation modal
      setOrderToPrintConfirm(updatedOrder);
      setIsPrintConfirmModalOpen(true);
      setOrderForPayment(null);
    } catch (error) {
      console.error('Payment error:', error);
      alert('⚠️ Erreur lors de l\'enregistrement du paiement: ' + error.message);
    } finally {
      setIsProcessingPayment(false);
    }
  }

  // Close payment modal (pay later)
  function closePaymentModal() {
    setIsPaymentModalOpen(false);
    setOrderForPayment(null);
    setAmountReceived('');
    setCalculatedChange(0);
  }

  // Confirm and execute print
  async function confirmPrint() {
    if (!orderToPrintConfirm) return;

    setIsPrinting(true);
    try {
      // Check printer availability
      if (!printerService.getConnectionStatus()) {
        alert('⚠️ Imprimante USB non connectée.\n\nVeuillez connecter l\'imprimante pour imprimer les tickets.');
        setIsPrinting(false);
        return;
      }

      // Prepare ticket data
      const clientName = orderToPrintConfirm.userId && usersMap[orderToPrintConfirm.userId]
        ? usersMap[orderToPrintConfirm.userId].name || usersMap[orderToPrintConfirm.userId].username
        : orderToPrintConfirm.customerName || 'Client';

      const additionalData = {
        cashierName: user?.name || user?.username || 'Caissier',
        clientName: clientName,
        paymentAmount: orderToPrintConfirm.paymentAmount,
        changeGiven: orderToPrintConfirm.changeGiven,
      };

      // Print the ticket
      await printerService.printOrderTicket(orderToPrintConfirm, additionalData);

      // Success
      alert('✓ Ticket imprimé avec succès!');
      setIsPrintConfirmModalOpen(false);
      setOrderToPrintConfirm(null);
    } catch (printError) {
      console.error('Print error:', printError);
      alert('⚠️ Erreur d\'impression: ' + printError.message + '\n\nVérifiez la connexion de l\'imprimante.');
    } finally {
      setIsPrinting(false);
    }
  }

  // Close print confirmation modal without printing
  function closePrintConfirmModal() {
    setIsPrintConfirmModalOpen(false);
    setOrderToPrintConfirm(null);
  }

  // Handle completing an order (checks for unpaid status)
  async function handleCompleteOrder(order) {
    // Check if order is unpaid
    if (order.paymentStatus === 'unpaid') {
      // Different behavior based on user role
      if (user?.role === 'cook') {
        // BLOCK cook completely - cannot complete unpaid orders
        alert(
          '⚠️ Impossible de terminer cette commande\n\n' +
          'Cette commande n\'a pas été payée. Veuillez contacter un caissier pour traiter le paiement avant de terminer la commande.'
        );
        return; // Do not proceed
      } else if (user?.role === 'cashier' || user?.role === 'manager') {
        // WARN cashier/manager but allow proceeding
        setOrderToCompleteUnpaid(order);
        setShowUnpaidWarningModal(true);
        return;
      } else {
        // Default: block for other roles
        alert('⚠️ Cette commande n\'a pas été payée.');
        return;
      }
    }

    // Order is paid, complete it directly
    await updateOrderStatus(order.id, 'completed');
  }

  // Confirm completing unpaid order
  async function confirmCompleteUnpaid() {
    if (!orderToCompleteUnpaid) return;

    try {
      await ordersService.updateStatus(orderToCompleteUnpaid.id, 'completed', {
        completedWithoutPayment: true,
        unpaidCompletionTime: new Date().toISOString(),
      });
      setShowUnpaidWarningModal(false);
      setOrderToCompleteUnpaid(null);
    } catch (error) {
      alert(errors.updateOrderFailed + ': ' + error.message);
    }
  }

  function getStatusColor(statusValue) {
    const colors = {
      awaiting_approval: 'bg-amber-100 text-amber-800',
      rejected: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      preparing: 'bg-blue-100 text-blue-800',
      ready: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[statusValue] || 'bg-gray-100 text-gray-800';
  }

  function getStatusLabel(statusValue) {
    return status[statusValue] || statusValue;
  }

  // Get client name (registered user or walk-in customer)
  function getClientName(order) {
    if (order.userId && usersMap[order.userId]) {
      return usersMap[order.userId].name || usersMap[order.userId].username;
    }
    return order.customerName || 'Client';
  }

  // Sort orders: ready orders first, then by updatedAt (newest first)
  function sortOrders(ordersArray) {
    return [...ordersArray].sort((a, b) => {
      // Priority 1: Ready orders first
      if (a.status === 'ready' && b.status !== 'ready') return -1;
      if (a.status !== 'ready' && b.status === 'ready') return 1;

      // Priority 2: Sort by updatedAt (most recent first)
      const aTime = a.updatedAt?.getTime() || 0;
      const bTime = b.updatedAt?.getTime() || 0;
      return bTime - aTime;
    });
  }

  // Format order time (relative time)
  function formatOrderTime(date) {
    if (!date) return '';

    const now = new Date();
    const orderTime = new Date(date);
    const diffMs = now - orderTime;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Il y a ${diffHours}h`;

    // Show absolute time for orders older than 24h
    return orderTime.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Status filter list
  const statusFilterList = [
    { value: 'all', label: 'Tous' },
    { value: 'pending', label: status.pending },
    { value: 'preparing', label: status.preparing },
    { value: 'ready', label: status.ready },
  ];

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
      {/* Approval Notifications */}
      <ApprovalNotification
        orders={pendingApprovalOrders}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {orders.title}
        </h1>
        <div className="flex flex-col gap-3 items-end">
          {/* Printer Connection & Status (Manager and Cashier only) */}
          {(user?.role === 'manager' || user?.role === 'cashier') && (
            <div className="flex items-center gap-2 relative">
              <PrinterConnection />
              <PrinterStatus />
            </div>
          )}
          <Button onClick={openCreateModal}>+ {orders.newOrder}</Button>
        </div>
      </div>

      {/* Active Orders */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          {orders.activeOrders}
        </h2>

        {/* Status Filter Chips */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '8px',
            marginBottom: '16px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
          className="scrollbar-hide"
        >
          {statusFilterList.map((statusItem) => (
            <button
              key={statusItem.value}
              onClick={() => setSelectedStatus(statusItem.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedStatus === statusItem.value
                  ? 'bg-primary-600 text-white'
                  : 'hover:bg-gray-200'
              }`}
              style={{
                whiteSpace: 'nowrap',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: selectedStatus === statusItem.value ? '' : 'var(--bg-tertiary)',
                color: selectedStatus === statusItem.value ? '' : 'var(--text-primary)',
              }}
            >
              {statusItem.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortOrders(
            ordersList.filter((order) => {
              // Exclude completed, cancelled, awaiting_approval, rejected
              if (['completed', 'cancelled', 'awaiting_approval', 'rejected'].includes(order.status)) {
                return false;
              }
              // Apply status filter
              if (selectedStatus === 'all') return true;
              return order.status === selectedStatus;
            })
          ).map((order) => (
              <Card
                key={order.id}
                className={highlightedOrders.has(order.id) ? 'order-updated p-4 cursor-pointer' : 'p-4 cursor-pointer'}
                onClick={() => viewOrderDetails(order.id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                      {order.orderNumber}
                    </h3>
                    <p className="text-lg font-semibold" style={{ color: 'var(--text-secondary)' }}>
                      {getClientName(order)}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      🕐 {formatOrderTime(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {getStatusLabel(order.status)}
                    </span>
                    {/* Payment Status Badge */}
                    {order.paymentStatus === 'paid' ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✓ Payé
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        ⏸ À payer
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-2">
                  <p className="text-xl font-bold text-primary-600">
                    {formatMAD(order.totalAmount)}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    {order.itemCount} {orders.item}(s)
                  </p>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {/* Payment button for managers and cashiers (only if unpaid) */}
                  {(user?.role === 'manager' || user?.role === 'cashier') && order.paymentStatus === 'unpaid' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        openPaymentModal(order.id);
                      }}
                      style={{ backgroundColor: '#f59e0b', color: 'white', border: 'none' }}
                    >
                      💰 Paiement
                    </Button>
                  )}
                  {/* Print button for managers and cashiers */}
                  {(user?.role === 'manager' || user?.role === 'cashier') && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        openPrintModal(order.id);
                      }}
                      style={{ backgroundColor: '#10b981', color: 'white', border: 'none' }}
                    >
                      🖨️ Imprimer
                    </Button>
                  )}
                  {order.status === 'pending' && (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateOrderStatus(order.id, 'preparing');
                      }}
                    >
                      {actions.start || 'Commencer'}
                    </Button>
                  )}
                  {order.status === 'preparing' && (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateOrderStatus(order.id, 'ready');
                      }}
                    >
                      Prêt
                    </Button>
                  )}
                  {order.status === 'ready' && (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCompleteOrder(order);
                      }}
                    >
                      Terminer
                    </Button>
                  )}
                </div>
              </Card>
            ))}
        </div>

        {ordersList.filter((o) => !['completed', 'cancelled', 'awaiting_approval', 'rejected'].includes(o.status))
          .length === 0 && (
          <p style={{ color: 'var(--text-tertiary)' }} className="text-center py-8">
            {orders.noActiveOrders}
          </p>
        )}
      </div>


      {/* Create Order Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={orders.newOrder}
        size="lg"
      >
        <form onSubmit={handleCreateOrder}>
          <div className="grid grid-cols-2 gap-8">
            {/* Menu Items */}
            <div>
              <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                {orders.menuItems}
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {menuItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-3 rounded-lg cursor-pointer"
                    style={{
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-primary)'
                    }}
                    onClick={() => addItemToOrder(item)}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-primary)'}
                  >
                    <div>
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {item.name}
                      </p>
                      <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                        {item.category}
                      </p>
                    </div>
                    <span className="font-bold text-primary-600">
                      {formatMAD(item.price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                {orders.orderItems}
              </h3>

              <div className="mb-4">
                <label className="label">{form.customerName} ({form.optional})</label>
                <input
                  type="text"
                  className="input"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="label">{form.notes} ({form.optional})</label>
                <textarea
                  className="input"
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                {orderItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 rounded"
                    style={{ border: '1px solid var(--border-color)' }}
                  >
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(index, parseInt(e.target.value))
                      }
                      className="w-16 px-2 py-1 rounded"
                      style={{ border: '1px solid var(--border-color)' }}
                    />
                    <span className="flex-1" style={{ color: 'var(--text-primary)' }}>
                      {item.name}
                    </span>
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {formatMAD(item.price * item.quantity)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItemFromOrder(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {orderItems.length === 0 && (
                <p className="text-center py-4" style={{ color: 'var(--text-tertiary)' }}>
                  {orders.clickToAdd}
                </p>
              )}

              <div style={{ borderTop: '1px solid var(--border-color)' }} className="pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {orders.total}:
                  </span>
                  <span className="text-2xl font-bold text-primary-600">
                    {formatMAD(calculateTotal())}
                  </span>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1"
                  >
                    {actions.cancel}
                  </Button>
                  <Button type="submit" className="flex-1">
                    {orders.createOrder}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* Order Details Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`${orders.orderNumber} ${selectedOrder?.orderNumber || ''}`}
      >
        {selectedOrder && (
          <div>
            <div className="mb-4">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  selectedOrder.status
                )}`}
              >
                {getStatusLabel(selectedOrder.status)}
              </span>
            </div>

            {selectedOrder.customerName && (
              <p className="mb-2" style={{ color: 'var(--text-primary)' }}>
                <strong>{orders.customer}:</strong> {selectedOrder.customerName}
              </p>
            )}

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
                      {form.quantity}: {item.quantity} × {formatMAD(item.price)}
                    </p>
                  </div>
                  <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                    {formatMAD(item.price * item.quantity)}
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

      {/* Payment Calculator Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={closePaymentModal}
        title="💰 Paiement"
        size="xl"
      >
        {orderForPayment && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Order Info & Display */}
            <div>
              {/* Order Summary */}
              <div
                className="mb-4 p-4 rounded-lg"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '2px solid #f59e0b'
                }}
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    {orderForPayment.orderNumber}
                  </h3>
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {getClientName(orderForPayment)}
                  </span>
                </div>

                {/* Total Amount - Large Display */}
                <div className="text-center py-3">
                  <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Total à payer:
                  </p>
                  <p className="text-3xl font-bold text-primary-600">
                    {formatMAD(orderForPayment.totalAmount)}
                  </p>
                </div>
              </div>

              {/* Calculator Display (readonly) */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Montant reçu:
                </label>
                <div
                  className="w-full px-4 py-4 text-3xl font-bold text-right rounded-lg border-2"
                  style={{
                    borderColor: calculatedChange >= 0 && amountReceived ? '#10b981' : '#d1d5db',
                    backgroundColor: '#f9fafb',
                    color: '#111827',
                    fontFamily: 'monospace',
                    minHeight: '70px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                  }}
                >
                  {amountReceived || '0'} MAD
                </div>
              </div>

              {/* Quick Bill Buttons */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Montants rapides:
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[20, 50, 100, 200, 500].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => handleQuickBill(amount)}
                      className="px-3 py-2 rounded-lg font-bold text-base transition-all"
                      style={{
                        backgroundColor: '#dbeafe',
                        color: '#1e40af',
                        border: '2px solid #3b82f6',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#bfdbfe';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#dbeafe';
                      }}
                    >
                      {amount}
                    </button>
                  ))}
                </div>
              </div>

              {/* Change Display */}
              {amountReceived && (
                <div
                  className="mb-4 p-4 rounded-lg text-center"
                  style={{
                    backgroundColor: calculatedChange >= 0 ? '#d1fae5' : '#fee2e2',
                    border: `2px solid ${calculatedChange >= 0 ? '#10b981' : '#ef4444'}`,
                  }}
                >
                  <p className="text-sm font-medium mb-1" style={{ color: calculatedChange >= 0 ? '#065f46' : '#991b1b' }}>
                    {calculatedChange >= 0 ? 'Monnaie à rendre:' : 'Montant insuffisant:'}
                  </p>
                  <p
                    className="text-3xl font-bold"
                    style={{ color: calculatedChange >= 0 ? '#10b981' : '#ef4444' }}
                  >
                    {formatMAD(Math.abs(calculatedChange))}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={closePaymentModal}
                  className="flex-1"
                  disabled={isProcessingPayment}
                >
                  ⏸ Payer plus tard
                </Button>
                <Button
                  type="button"
                  onClick={processPayment}
                  className="flex-1"
                  disabled={isProcessingPayment || !amountReceived || calculatedChange < 0}
                  style={{
                    backgroundColor: isProcessingPayment || !amountReceived || calculatedChange < 0 ? '#9ca3af' : '#10b981',
                    opacity: !amountReceived || calculatedChange < 0 ? 0.5 : 1,
                  }}
                >
                  {isProcessingPayment ? '⏳ Traitement...' : '✓ Confirmer'}
                </Button>
              </div>
            </div>

            {/* Right Column: Calculator Keypad */}
            <div>
              <div className="grid grid-cols-3 gap-3">
                {/* Number pad: 7-9 */}
                {['7', '8', '9'].map((key) => (
                  <button
                    key={key}
                    onClick={() => handleKeypadClick(key)}
                    className="keypad-btn"
                    style={{
                      padding: '24px',
                      fontSize: '28px',
                      fontWeight: 'bold',
                      backgroundColor: '#f3f4f6',
                      border: '2px solid #d1d5db',
                      borderRadius: '12px',
                      color: '#111827',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      userSelect: 'none',
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.backgroundColor = '#e5e7eb';
                      e.currentTarget.style.transform = 'scale(0.95)';
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    {key}
                  </button>
                ))}

                {/* Number pad: 4-6 */}
                {['4', '5', '6'].map((key) => (
                  <button
                    key={key}
                    onClick={() => handleKeypadClick(key)}
                    className="keypad-btn"
                    style={{
                      padding: '24px',
                      fontSize: '28px',
                      fontWeight: 'bold',
                      backgroundColor: '#f3f4f6',
                      border: '2px solid #d1d5db',
                      borderRadius: '12px',
                      color: '#111827',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      userSelect: 'none',
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.backgroundColor = '#e5e7eb';
                      e.currentTarget.style.transform = 'scale(0.95)';
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    {key}
                  </button>
                ))}

                {/* Number pad: 1-3 */}
                {['1', '2', '3'].map((key) => (
                  <button
                    key={key}
                    onClick={() => handleKeypadClick(key)}
                    className="keypad-btn"
                    style={{
                      padding: '24px',
                      fontSize: '28px',
                      fontWeight: 'bold',
                      backgroundColor: '#f3f4f6',
                      border: '2px solid #d1d5db',
                      borderRadius: '12px',
                      color: '#111827',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      userSelect: 'none',
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.backgroundColor = '#e5e7eb';
                      e.currentTarget.style.transform = 'scale(0.95)';
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    {key}
                  </button>
                ))}

                {/* Bottom row: . 0 ⌫ */}
                <button
                  onClick={() => handleKeypadClick('.')}
                  className="keypad-btn"
                  style={{
                    padding: '24px',
                    fontSize: '28px',
                    fontWeight: 'bold',
                    backgroundColor: '#f3f4f6',
                    border: '2px solid #d1d5db',
                    borderRadius: '12px',
                    color: '#111827',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    userSelect: 'none',
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.backgroundColor = '#e5e7eb';
                    e.currentTarget.style.transform = 'scale(0.95)';
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  .
                </button>

                <button
                  onClick={() => handleKeypadClick('0')}
                  className="keypad-btn"
                  style={{
                    padding: '24px',
                    fontSize: '28px',
                    fontWeight: 'bold',
                    backgroundColor: '#f3f4f6',
                    border: '2px solid #d1d5db',
                    borderRadius: '12px',
                    color: '#111827',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    userSelect: 'none',
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.backgroundColor = '#e5e7eb';
                    e.currentTarget.style.transform = 'scale(0.95)';
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  0
                </button>

                <button
                  onClick={() => handleKeypadClick('⌫')}
                  className="keypad-btn"
                  style={{
                    padding: '24px',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    backgroundColor: '#fed7aa',
                    border: '2px solid #f59e0b',
                    borderRadius: '12px',
                    color: '#92400e',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    userSelect: 'none',
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.backgroundColor = '#fdba74';
                    e.currentTarget.style.transform = 'scale(0.95)';
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.backgroundColor = '#fed7aa';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#fed7aa';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  ⌫
                </button>

                {/* Clear button - spans all 3 columns */}
                <button
                  onClick={() => handleKeypadClick('C')}
                  className="keypad-btn col-span-3"
                  style={{
                    padding: '20px',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    backgroundColor: '#fecaca',
                    border: '2px solid #ef4444',
                    borderRadius: '12px',
                    color: '#991b1b',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    userSelect: 'none',
                    marginTop: '8px',
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.backgroundColor = '#fca5a5';
                    e.currentTarget.style.transform = 'scale(0.98)';
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.backgroundColor = '#fecaca';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#fecaca';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  Effacer (C)
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Print Modal */}
      <Modal
        isOpen={isPrintModalOpen}
        onClose={() => {
          setIsPrintModalOpen(false);
          setOrderToPrint(null);
        }}
        title="🖨️ Imprimer le ticket"
      >
        {orderToPrint && (
          <div>
            {/* Printer Status Badge */}
            <div className="mb-4 flex items-center gap-2">
              <span
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                  printerConnected
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                <span className="text-lg">{printerConnected ? '✓' : '⚠️'}</span>
                {printerConnected ? 'Imprimante connectée' : 'Imprimante déconnectée'}
              </span>
            </div>

            {/* Order Preview */}
            <div
              className="mb-4 p-4 rounded-lg"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '2px solid var(--border-color)'
              }}
            >
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {orderToPrint.orderNumber}
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {getClientName(orderToPrint)}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    orderToPrint.status
                  )}`}
                >
                  {getStatusLabel(orderToPrint.status)}
                </span>
              </div>

              {/* Items Summary */}
              <div className="space-y-2 mb-3">
                {orderToPrint.items?.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between text-sm"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <span>
                      {item.quantity}× {item.name}
                    </span>
                    <span className="font-medium">{formatMAD(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div
                className="pt-3 flex justify-between items-center"
                style={{ borderTop: '2px solid var(--border-color)' }}
              >
                <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  Total:
                </span>
                <span className="text-2xl font-bold text-primary-600">
                  {formatMAD(orderToPrint.totalAmount)}
                </span>
              </div>
            </div>

            {/* Warning if printer disconnected */}
            {!printerConnected && (
              <div
                className="mb-4 p-3 rounded-lg"
                style={{
                  backgroundColor: '#fef3c7',
                  border: '1px solid #f59e0b'
                }}
              >
                <p className="text-sm" style={{ color: '#92400e' }}>
                  ⚠️ L'imprimante n'est pas connectée. Veuillez connecter l'imprimante USB avant
                  d'imprimer.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsPrintModalOpen(false);
                  setOrderToPrint(null);
                }}
                className="flex-1"
                disabled={isPrinting}
              >
                Annuler
              </Button>
              <Button
                type="button"
                onClick={executePrint}
                className="flex-1"
                disabled={isPrinting || !printerConnected}
                style={{
                  backgroundColor: isPrinting ? '#9ca3af' : '#10b981',
                  opacity: !printerConnected ? 0.5 : 1
                }}
              >
                {isPrinting ? '⏳ Impression...' : '🖨️ Imprimer'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Print Confirmation Modal */}
      <Modal
        isOpen={isPrintConfirmModalOpen}
        onClose={closePrintConfirmModal}
        title="🖨️ Imprimer le reçu"
      >
        {orderToPrintConfirm && (
          <div>
            {/* Printer Status */}
            <div className="mb-4 flex items-center justify-center gap-2">
              <span
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                  printerConnected
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                <span className="text-lg">{printerConnected ? '✓' : '⚠️'}</span>
                {printerConnected ? 'Imprimante connectée' : 'Imprimante déconnectée'}
              </span>
            </div>

            {/* Order Summary */}
            <div
              className="mb-4 p-4 rounded-lg"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '2px solid #3b82f6'
              }}
            >
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {orderToPrintConfirm.orderNumber}
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {getClientName(orderToPrintConfirm)}
                  </p>
                </div>
                {orderToPrintConfirm.paymentStatus === 'paid' ? (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    ✓ Payé
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                    ⏸ À payer
                  </span>
                )}
              </div>

              {/* Payment Info if paid */}
              {orderToPrintConfirm.paymentStatus === 'paid' && (
                <div
                  className="mb-3 p-3 rounded-lg"
                  style={{
                    backgroundColor: '#d1fae5',
                    border: '1px solid #10b981'
                  }}
                >
                  <div className="flex justify-between text-sm mb-1">
                    <span style={{ color: '#065f46' }}>Montant reçu:</span>
                    <span className="font-bold" style={{ color: '#065f46' }}>
                      {formatMAD(orderToPrintConfirm.paymentAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#065f46' }}>Monnaie rendue:</span>
                    <span className="font-bold" style={{ color: '#065f46' }}>
                      {formatMAD(orderToPrintConfirm.changeGiven)}
                    </span>
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="text-center py-2">
                <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Total:
                </p>
                <p className="text-3xl font-bold text-primary-600">
                  {formatMAD(orderToPrintConfirm.totalAmount)}
                </p>
              </div>
            </div>

            {/* Question */}
            <p className="text-center text-lg font-medium mb-4" style={{ color: 'var(--text-primary)' }}>
              Voulez-vous imprimer le reçu pour cette commande?
            </p>

            {/* Warning if printer disconnected */}
            {!printerConnected && (
              <div
                className="mb-4 p-3 rounded-lg"
                style={{
                  backgroundColor: '#fef3c7',
                  border: '1px solid #f59e0b'
                }}
              >
                <p className="text-sm text-center" style={{ color: '#92400e' }}>
                  ⚠️ L'imprimante n'est pas connectée. Veuillez la connecter avant d'imprimer.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={closePrintConfirmModal}
                className="flex-1"
                disabled={isPrinting}
              >
                Non merci
              </Button>
              <Button
                type="button"
                onClick={confirmPrint}
                className="flex-1"
                disabled={isPrinting || !printerConnected}
                style={{
                  backgroundColor: isPrinting || !printerConnected ? '#9ca3af' : '#10b981',
                  opacity: !printerConnected ? 0.5 : 1
                }}
              >
                {isPrinting ? '⏳ Impression...' : '🖨️ Oui, imprimer'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Unpaid Warning Modal */}
      <Modal
        isOpen={showUnpaidWarningModal}
        onClose={() => setShowUnpaidWarningModal(false)}
        title="⚠️ Commande non payée"
      >
        {orderToCompleteUnpaid && (
          <div>
            {/* Warning Message */}
            <div
              className="mb-4 p-4 rounded-lg"
              style={{
                backgroundColor: '#fef3c7',
                border: '2px solid #f59e0b'
              }}
            >
              <p className="text-lg font-semibold mb-2" style={{ color: '#92400e' }}>
                ⚠️ Attention!
              </p>
              <p className="text-sm" style={{ color: '#92400e' }}>
                Cette commande n'a pas été payée. Êtes-vous sûr de vouloir la marquer comme terminée?
              </p>
            </div>

            {/* Order Details */}
            <div
              className="mb-4 p-4 rounded-lg"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '2px solid var(--border-color)'
              }}
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  {orderToCompleteUnpaid.orderNumber}
                </h3>
                <span className="px-2 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                  ⏸ À payer
                </span>
              </div>

              <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                Client: {getClientName(orderToCompleteUnpaid)}
              </p>

              <p className="text-2xl font-bold text-primary-600">
                {formatMAD(orderToCompleteUnpaid.totalAmount)}
              </p>
            </div>

            {/* Information Note */}
            <div
              className="mb-4 p-3 rounded-lg"
              style={{
                backgroundColor: '#e0e7ff',
                border: '1px solid #6366f1'
              }}
            >
              <p className="text-sm" style={{ color: '#3730a3' }}>
                ℹ️ Cette action sera enregistrée dans l'historique des commandes pour suivi.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowUnpaidWarningModal(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                type="button"
                onClick={confirmCompleteUnpaid}
                className="flex-1"
                style={{
                  backgroundColor: '#f59e0b',
                  color: 'white'
                }}
              >
                Oui, terminer quand même
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
