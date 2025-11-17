/**
 * Ticket Formatter Service
 * Formats order data into printable receipt text for 80mm thermal printer (48 characters wide)
 */

import printerConfig from '../config/printerConfig';

/**
 * Format order into a printable ticket
 * @param {Object} order - Order object from Firestore
 * @param {Object} additionalData - Additional data (cashier name, etc.)
 * @returns {string} Formatted ticket text
 */
export function formatOrderTicket(order, additionalData = {}, settings = {}) {
  const { paper, restaurant, ticket } = printerConfig;
  const width = paper.width;
  const lines = [];

  // Use settings if provided, otherwise fall back to printerConfig
  const useSettings = settings?.ticket || {};

  // Helper functions for text formatting
  const centerText = (text) => {
    const padding = Math.floor((width - text.length) / 2);
    return ' '.repeat(Math.max(0, padding)) + text;
  };

  const rightAlign = (text) => {
    const padding = width - text.length;
    return ' '.repeat(Math.max(0, padding)) + text;
  };

  const twoColumn = (left, right) => {
    const maxLeft = width - right.length - 1;
    const truncatedLeft = left.length > maxLeft ? left.substring(0, maxLeft - 3) + '...' : left;
    const padding = width - truncatedLeft.length - right.length;
    return truncatedLeft + ' '.repeat(Math.max(1, padding)) + right;
  };

  const separator = () => ticket.separator.repeat(ticket.separatorLength);

  const formatPrice = (amount) => {
    return amount.toFixed(2).replace('.', ',') + ' ' + ticket.currencySymbol;
  };

  const formatDateTime = (date) => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  // ============================================
  // HEADER SECTION
  // ============================================
  lines.push(separator());
  lines.push(centerText(restaurant.name));
  lines.push(centerText(restaurant.address));
  lines.push(centerText(restaurant.phone));
  lines.push(separator());
  lines.push('');

  // ============================================
  // ORDER INFORMATION SECTION
  // ============================================
  lines.push(`Date: ${formatDateTime(order.createdAt)}`);
  lines.push(`Commande: ${order.orderNumber || order.id}`);

  // Client name
  const clientName = additionalData.clientName || order.customerName || 'Client';
  lines.push(`Client: ${clientName}`);

  // Cashier name (if provided and enabled)
  const showCashierName = useSettings.showCashierName !== undefined ? useSettings.showCashierName : ticket.printCashierName;
  if (showCashierName && additionalData.cashierName) {
    lines.push(`Caissier: ${additionalData.cashierName}`);
  }

  lines.push(separator());
  lines.push('');

  // ============================================
  // ITEMS SECTION
  // ============================================
  lines.push('ARTICLES:');
  lines.push('-'.repeat(width));

  if (order.items && order.items.length > 0) {
    order.items.forEach((item) => {
      // Item line: quantity x name
      const itemLine = `${item.quantity}x ${item.name}`;
      lines.push(itemLine);

      // Price line: unit price x quantity = subtotal
      const unitPrice = formatPrice(item.price);
      const subtotal = formatPrice(item.price * item.quantity);
      const priceLine = `   ${unitPrice} x ${item.quantity}`;
      const priceLineFormatted = twoColumn(priceLine, subtotal);
      lines.push(priceLineFormatted);

      // Notes (if any)
      const showNotes = useSettings.kitchenTicketFormat?.showNotes !== undefined ? useSettings.kitchenTicketFormat.showNotes : ticket.printOrderNotes;
      if (item.notes && showNotes) {
        lines.push(`   Note: ${item.notes}`);
      }

      lines.push(''); // Empty line between items
    });
  } else {
    lines.push(centerText('Aucun article'));
    lines.push('');
  }

  // ============================================
  // TOTALS SECTION
  // ============================================
  lines.push(separator());

  // Subtotal
  const subtotal = order.totalAmount || 0;
  lines.push(twoColumn('Sous-total:', formatPrice(subtotal)));

  // Tax (if enabled)
  const showTVA = useSettings.showTVA !== undefined ? useSettings.showTVA : ticket.showTax;
  const tvaRate = useSettings.tvaRate !== undefined ? (useSettings.tvaRate / 100) : restaurant.taxRate;

  if (showTVA && tvaRate > 0) {
    const tax = subtotal * tvaRate;
    const taxLabel = `TVA (${(tvaRate * 100).toFixed(0)}%):`;
    lines.push(twoColumn(taxLabel, formatPrice(tax)));
  }

  lines.push('-'.repeat(width));

  // Total
  const total = showTVA && tvaRate > 0
    ? subtotal * (1 + tvaRate)
    : subtotal;
  lines.push(twoColumn('TOTAL:', formatPrice(total)));

  lines.push(separator());
  lines.push('');

  // ============================================
  // FOOTER SECTION
  // ============================================
  const footerMessage = useSettings.footerMessage !== undefined ? useSettings.footerMessage : ticket.thankYouMessage;

  // Handle both string and array formats
  const footerLines = typeof footerMessage === 'string' ? [footerMessage] : footerMessage;
  footerLines.forEach((msg) => {
    lines.push(centerText(msg));
  });

  lines.push('');
  lines.push(separator());

  // Timestamp
  const now = new Date();
  lines.push(centerText(formatDateTime(now)));

  lines.push('');

  // Join all lines with newline
  return lines.join('\n');
}

/**
 * Generate a test ticket for printer testing
 * @returns {string} Test ticket text
 */
export function formatTestTicket() {
  const testOrder = {
    orderNumber: 'TEST-001',
    createdAt: new Date(),
    customerName: 'Test Client',
    items: [
      {
        name: 'Burger Classique',
        quantity: 2,
        price: 35.00,
      },
      {
        name: 'Frites',
        quantity: 1,
        price: 15.00,
      },
      {
        name: 'Coca-Cola',
        quantity: 2,
        price: 12.00,
      },
    ],
    totalAmount: 109.00,
  };

  const additionalData = {
    cashierName: 'Test Cashier',
    clientName: 'Test Client',
  };

  return formatOrderTicket(testOrder, additionalData);
}

/**
 * Format order into a kitchen ticket (compact format for cooks)
 * @param {Object} order - Order object from Firestore
 * @param {Object} settings - Restaurant settings
 * @returns {string} Formatted kitchen ticket text
 */
export function formatKitchenTicket(order, settings = {}) {
  const lines = [];

  // Apply fontSize setting (small=30, medium=35, large=40)
  const fontSize = settings?.ticket?.kitchenTicketFormat?.fontSize || 'medium';
  const width = fontSize === 'small' ? 30 : fontSize === 'large' ? 40 : 35;

  // Helper functions
  const centerText = (text) => {
    const padding = Math.floor((width - text.length) / 2);
    return ' '.repeat(Math.max(0, padding)) + text;
  };

  const separator = () => '='.repeat(width);
  const lightSeparator = () => '-'.repeat(width);

  const formatDateTime = (date) => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // ============================================
  // HEADER - MINIMAL
  // ============================================
  lines.push(separator());
  lines.push('');

  // Large order number (conditionally shown based on settings)
  const showOrderNumber = settings?.ticket?.kitchenTicketFormat?.showOrderNumber !== false;
  if (showOrderNumber) {
    lines.push(centerText('COMMANDE'));
    lines.push(centerText(`#${order.orderNumber || order.id.slice(-4).toUpperCase()}`));
    lines.push('');
  }
  lines.push(separator());
  lines.push('');

  // Time (conditionally shown based on settings)
  const showDateTime = settings?.ticket?.kitchenTicketFormat?.showDateTime !== false;
  if (showDateTime) {
    lines.push(`Heure: ${formatDateTime(order.createdAt)}`);
    lines.push('');
  }

  // Order type and table info
  if (order.orderType) {
    const typeLabel = order.orderType === 'dine-in' ? 'Sur place' :
                      order.orderType === 'takeout' ? 'A emporter' :
                      'Enlèvement';
    lines.push(`Type: ${typeLabel}`);
  }

  if (order.tableNumber) {
    lines.push(`Table: ${order.tableNumber}`);
  }

  if (order.isGuestOrder) {
    lines.push('Self-Service');
  }

  lines.push('');
  lines.push(lightSeparator());
  lines.push('');

  // ============================================
  // ITEMS - NO PRICES
  // ============================================
  lines.push('ARTICLES:');
  lines.push('');

  // Check if notes should be shown
  const showNotes = settings?.ticket?.kitchenTicketFormat?.showNotes !== false;

  if (order.items && order.items.length > 0) {
    order.items.forEach((item, index) => {
      // Item line: quantity x name
      const itemLine = `${item.quantity}x ${item.name}`;
      lines.push(itemLine);

      // Notes (conditionally shown based on settings)
      if (showNotes && item.notes) {
        const notesLines = item.notes.match(/.{1,30}/g) || [item.notes];
        notesLines.forEach((noteLine) => {
          lines.push(`   ** ${noteLine}`);
        });
      }

      // Add space between items except last one
      if (index < order.items.length - 1) {
        lines.push('');
      }
    });
  } else {
    lines.push(centerText('Aucun article'));
  }

  lines.push('');
  lines.push(separator());
  lines.push('');

  // ============================================
  // FOOTER
  // ============================================
  // Total items count
  const totalItems = order.items ? order.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
  lines.push(centerText(`Total: ${totalItems} article${totalItems > 1 ? 's' : ''}`));

  lines.push('');
  lines.push(separator());
  lines.push('');

  // Join all lines with newline
  return lines.join('\n');
}

export default {
  formatOrderTicket,
  formatKitchenTicket,
  formatTestTicket,
};
