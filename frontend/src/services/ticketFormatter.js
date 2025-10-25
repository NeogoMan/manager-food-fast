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
export function formatOrderTicket(order, additionalData = {}) {
  const { paper, restaurant, ticket } = printerConfig;
  const width = paper.width;
  const lines = [];

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
  if (ticket.printCashierName && additionalData.cashierName) {
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
      if (item.notes && ticket.printOrderNotes) {
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
  if (ticket.showTax && restaurant.taxRate > 0) {
    const tax = subtotal * restaurant.taxRate;
    const taxLabel = `TVA (${(restaurant.taxRate * 100).toFixed(0)}%):`;
    lines.push(twoColumn(taxLabel, formatPrice(tax)));
  }

  lines.push('-'.repeat(width));

  // Total
  const total = ticket.showTax && restaurant.taxRate > 0
    ? subtotal * (1 + restaurant.taxRate)
    : subtotal;
  lines.push(twoColumn('TOTAL:', formatPrice(total)));

  lines.push(separator());
  lines.push('');

  // ============================================
  // FOOTER SECTION
  // ============================================
  ticket.thankYouMessage.forEach((msg) => {
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

export default {
  formatOrderTicket,
  formatTestTicket,
};
