/**
 * WDLink Printer Configuration
 * Optimized for Android Tablet + Web USB API
 *
 * IMPORTANT: Update the USB Vendor ID and Product ID after finding them.
 * See PRINTER_SETUP.md for instructions on how to find these IDs.
 */

export const printerConfig = {
  // USB Device Configuration
  usb: {
    // PLACEHOLDER: Replace with your actual WDLink printer IDs
    // See PRINTER_SETUP.md for instructions on finding these values
    vendorId: 0x0000,  // TODO: Update with actual vendor ID
    productId: 0x0000, // TODO: Update with actual product ID

    // Android-specific settings
    interfaceNumber: 0,        // Usually interface 0 for thermal printers
    endpointNumber: 1,         // Usually endpoint 1 for OUT
    configurationValue: 1,     // Usually configuration 1

    // Connection behavior
    autoReconnect: true,       // Attempt auto-reconnect on app load
    reconnectTimeout: 5000,    // Max time to wait for reconnection (ms)
    connectionCheckInterval: 30000, // Check connection every 30 seconds
  },

  // Paper Configuration
  paper: {
    width: 48, // 80mm paper = 48 characters per line
    encoding: 'windows-1252', // Supports French characters
  },

  // Restaurant Information
  restaurant: {
    name: 'RESTAURANT FAST FOOD',
    address: '123 Rue Mohammed V, Casablanca',
    phone: '+212 5XX-XXXXXX',
    taxRate: 0.20, // 20% TVA
  },

  // Ticket Formatting
  ticket: {
    separator: '=',
    separatorLength: 48,
    currencySymbol: 'DH',
    locale: 'fr-MA',
    dateFormat: {
      date: 'DD/MM/YYYY',
      time: 'HH:mm',
      dateTime: 'DD/MM/YYYY HH:mm',
    },
    thankYouMessage: [
      'Merci de votre visite!',
      'À bientôt!',
    ],
    printCashierName: true,
    printOrderNotes: true,
    showTax: true,
    autocut: true, // Send paper cut command after printing
  },

  // ESC/POS Commands (for reference)
  escpos: {
    // Character code table for French
    codepage: 0, // PC437 (default) - supports basic Latin characters
    // Alternative: codepage: 2 for PC850 (more European characters)
  },
};

export default printerConfig;
