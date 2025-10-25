/**
 * WDLink Printer Service
 * Web USB API with Smart Auto-Reconnection for Android Tablet
 */

import printerConfig from '../config/printerConfig';
import { formatOrderTicket, formatTestTicket } from './ticketFormatter';

// LocalStorage keys
const STORAGE_KEYS = {
  LAST_PRINTER: 'wdlink_last_printer',
  AUTO_RECONNECT: 'wdlink_auto_reconnect',
  LAST_CONNECTED: 'wdlink_last_connected',
};

class PrinterService {
  constructor() {
    this.device = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.connectionMonitor = null;

    // Callbacks
    this.onConnectionChange = null;
    this.onError = null;
    this.onReconnecting = null;
  }

  // ============================================
  // LOCAL STORAGE MANAGEMENT
  // ============================================

  /**
   * Save printer info to localStorage for auto-reconnect
   */
  savePrinterInfo(device) {
    try {
      const printerInfo = {
        vendorId: device.vendorId,
        productId: device.productId,
        productName: device.productName || 'WDLink Printer',
        manufacturerName: device.manufacturerName || 'Unknown',
        serialNumber: device.serialNumber || null,
      };

      localStorage.setItem(STORAGE_KEYS.LAST_PRINTER, JSON.stringify(printerInfo));
      localStorage.setItem(STORAGE_KEYS.LAST_CONNECTED, new Date().toISOString());
      localStorage.setItem(STORAGE_KEYS.AUTO_RECONNECT, 'true');

      console.log('✓ Printer info saved for auto-reconnect:', printerInfo);
    } catch (error) {
      console.warn('Failed to save printer info:', error);
    }
  }

  /**
   * Get saved printer info from localStorage
   */
  getSavedPrinterInfo() {
    try {
      const printerInfoStr = localStorage.getItem(STORAGE_KEYS.LAST_PRINTER);
      const autoReconnect = localStorage.getItem(STORAGE_KEYS.AUTO_RECONNECT);

      if (!printerInfoStr || autoReconnect !== 'true') {
        return null;
      }

      return JSON.parse(printerInfoStr);
    } catch (error) {
      console.warn('Failed to load saved printer info:', error);
      return null;
    }
  }

  /**
   * Clear saved printer info
   */
  clearSavedPrinterInfo() {
    try {
      localStorage.removeItem(STORAGE_KEYS.LAST_PRINTER);
      localStorage.removeItem(STORAGE_KEYS.AUTO_RECONNECT);
      console.log('✓ Saved printer info cleared');
    } catch (error) {
      console.warn('Failed to clear printer info:', error);
    }
  }

  // ============================================
  // ESC/POS COMMAND BUILDERS
  // ============================================

  static Commands = {
    INIT: [0x1B, 0x40],
    ALIGN_LEFT: [0x1B, 0x61, 0x00],
    ALIGN_CENTER: [0x1B, 0x61, 0x01],
    ALIGN_RIGHT: [0x1B, 0x61, 0x02],
    BOLD_ON: [0x1B, 0x45, 0x01],
    BOLD_OFF: [0x1B, 0x45, 0x00],
    SIZE_NORMAL: [0x1D, 0x21, 0x00],
    SIZE_DOUBLE_WIDTH: [0x1D, 0x21, 0x10],
    SIZE_DOUBLE_HEIGHT: [0x1D, 0x21, 0x01],
    SIZE_DOUBLE_BOTH: [0x1D, 0x21, 0x11],
    LINE_FEED: [0x0A],
    FEED_LINES: (n) => [0x1B, 0x64, n],
    CUT_FULL: [0x1D, 0x56, 0x00],
    CUT_PARTIAL: [0x1D, 0x56, 0x01],
    SELECT_CODEPAGE: (n) => [0x1B, 0x74, n],
  };

  encodeText(text) {
    const encoder = new TextEncoder();
    return encoder.encode(text);
  }

  buildPrintData(text) {
    const commands = [];
    commands.push(...PrinterService.Commands.INIT);
    commands.push(...PrinterService.Commands.SELECT_CODEPAGE(0));
    commands.push(...PrinterService.Commands.SIZE_NORMAL);
    commands.push(...PrinterService.Commands.ALIGN_LEFT);

    const textBytes = this.encodeText(text);
    commands.push(...textBytes);

    commands.push(...PrinterService.Commands.LINE_FEED);
    commands.push(...PrinterService.Commands.LINE_FEED);
    commands.push(...PrinterService.Commands.LINE_FEED);

    if (printerConfig.ticket.autocut) {
      commands.push(...PrinterService.Commands.CUT_PARTIAL);
    }

    return new Uint8Array(commands);
  }

  // ============================================
  // WEB USB CONNECTION
  // ============================================

  /**
   * Check if Web USB is supported
   */
  isWebUSBSupported() {
    return 'usb' in navigator;
  }

  /**
   * Manual connection - User selects printer from browser dialog
   */
  async connect() {
    if (!this.isWebUSBSupported()) {
      throw new Error(
        'Web USB non supporté. Utilisez Chrome sur Android 6.0+ ou un navigateur compatible.'
      );
    }

    this.isConnecting = true;

    try {
      // Request USB device with filter
      console.log('Requesting USB device...');

      // Build request options - filters property MUST always be present
      const requestOptions = {
        filters: []  // Empty array = show ALL USB devices
      };

      // Add specific filter if we have valid vendor/product IDs
      if (printerConfig.usb.vendorId !== 0x0000 && printerConfig.usb.productId !== 0x0000) {
        requestOptions.filters = [{
          vendorId: printerConfig.usb.vendorId,
          productId: printerConfig.usb.productId,
        }];
      }

      this.device = await navigator.usb.requestDevice(requestOptions);

      // Open and configure device
      await this.openAndConfigureDevice(this.device);

      // Save printer info for auto-reconnect
      this.savePrinterInfo(this.device);

      // Start connection monitoring
      this.startConnectionMonitoring();

      this.isConnected = true;
      this.isConnecting = false;

      if (this.onConnectionChange) {
        this.onConnectionChange(true);
      }

      console.log('✓ Printer connected:', this.device.productName);
      return {
        success: true,
        message: 'Imprimante connectée avec succès',
        printer: {
          name: this.device.productName,
          vendor: this.device.manufacturerName,
        },
      };
    } catch (error) {
      this.isConnecting = false;
      this.isConnected = false;
      console.error('Connection error:', error);

      let errorMessage = 'Erreur de connexion à l\'imprimante';
      if (error.name === 'NotFoundError') {
        errorMessage = 'Aucune imprimante sélectionnée';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Web USB non supporté sur ce navigateur';
      } else if (error.name === 'SecurityError') {
        errorMessage = 'Accès USB refusé. Vérifiez les permissions.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      if (this.onError) {
        this.onError(errorMessage);
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Auto-reconnect to previously connected printer
   * Called on app load
   */
  async autoReconnect() {
    if (!this.isWebUSBSupported()) {
      console.log('Web USB not supported, skipping auto-reconnect');
      return { success: false, reason: 'not_supported' };
    }

    if (!printerConfig.usb.autoReconnect) {
      console.log('Auto-reconnect disabled in config');
      return { success: false, reason: 'disabled' };
    }

    const savedPrinter = this.getSavedPrinterInfo();
    if (!savedPrinter) {
      console.log('No saved printer found for auto-reconnect');
      return { success: false, reason: 'no_saved_printer' };
    }

    console.log('Attempting auto-reconnect to:', savedPrinter.productName);

    if (this.onReconnecting) {
      this.onReconnecting(true);
    }

    try {
      // Get list of authorized devices
      const devices = await navigator.usb.getDevices();
      console.log(`Found ${devices.length} authorized USB device(s)`);

      // Find matching device
      const matchingDevice = devices.find(
        (d) =>
          d.vendorId === savedPrinter.vendorId &&
          d.productId === savedPrinter.productId
      );

      if (!matchingDevice) {
        console.log('Previously connected printer not found in authorized devices');
        if (this.onReconnecting) {
          this.onReconnecting(false);
        }
        return { success: false, reason: 'device_not_found' };
      }

      console.log('Found matching device, opening connection...');
      this.device = matchingDevice;

      // Open and configure device
      await this.openAndConfigureDevice(this.device);

      // Start monitoring
      this.startConnectionMonitoring();

      this.isConnected = true;

      if (this.onConnectionChange) {
        this.onConnectionChange(true);
      }

      if (this.onReconnecting) {
        this.onReconnecting(false);
      }

      console.log('✓ Auto-reconnect successful');
      return {
        success: true,
        message: 'Reconnexion automatique réussie',
        printer: {
          name: savedPrinter.productName,
        },
      };
    } catch (error) {
      console.error('Auto-reconnect failed:', error);

      if (this.onReconnecting) {
        this.onReconnecting(false);
      }

      return {
        success: false,
        reason: 'connection_failed',
        error: error.message,
      };
    }
  }

  /**
   * Open USB device and configure it
   */
  async openAndConfigureDevice(device) {
    await device.open();

    if (device.configuration === null) {
      await device.selectConfiguration(printerConfig.usb.configurationValue);
    }

    await device.claimInterface(printerConfig.usb.interfaceNumber);
  }

  /**
   * Disconnect from printer
   */
  async disconnect() {
    try {
      this.stopConnectionMonitoring();

      if (this.device && this.device.opened) {
        await this.device.close();
      }

      this.device = null;
      this.isConnected = false;

      if (this.onConnectionChange) {
        this.onConnectionChange(false);
      }

      console.log('✓ Printer disconnected');
      return { success: true, message: 'Imprimante déconnectée' };
    } catch (error) {
      console.error('Disconnect error:', error);
      throw new Error('Erreur lors de la déconnexion');
    }
  }

  /**
   * Forget saved printer (disable auto-reconnect)
   */
  forgetPrinter() {
    this.clearSavedPrinterInfo();
    this.disconnect();
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return this.isConnected && this.device !== null;
  }

  /**
   * Get saved printer name
   */
  getSavedPrinterName() {
    const saved = this.getSavedPrinterInfo();
    return saved?.productName || null;
  }

  // ============================================
  // CONNECTION MONITORING
  // ============================================

  /**
   * Start monitoring connection status
   * Checks periodically if device is still connected
   */
  startConnectionMonitoring() {
    if (this.connectionMonitor) {
      clearInterval(this.connectionMonitor);
    }

    this.connectionMonitor = setInterval(async () => {
      if (!this.device) {
        this.stopConnectionMonitoring();
        return;
      }

      try {
        // Try to check if device is still connected
        // If device was disconnected, this will throw an error
        if (!this.device.opened) {
          throw new Error('Device closed');
        }
      } catch (error) {
        console.warn('Connection lost:', error);
        this.handleConnectionLost();
      }
    }, printerConfig.usb.connectionCheckInterval);
  }

  /**
   * Stop connection monitoring
   */
  stopConnectionMonitoring() {
    if (this.connectionMonitor) {
      clearInterval(this.connectionMonitor);
      this.connectionMonitor = null;
    }
  }

  /**
   * Handle connection lost event
   */
  handleConnectionLost() {
    this.isConnected = false;
    this.device = null;
    this.stopConnectionMonitoring();

    if (this.onConnectionChange) {
      this.onConnectionChange(false);
    }

    if (this.onError) {
      this.onError('Connexion perdue. Veuillez rebrancher l\'imprimante.');
    }
  }

  // ============================================
  // PRINTING OPERATIONS
  // ============================================

  /**
   * Send data to printer via USB
   */
  async sendToPrinter(data) {
    if (!this.isConnected || !this.device) {
      throw new Error('Imprimante non connectée');
    }

    try {
      await this.device.transferOut(printerConfig.usb.endpointNumber, data);
      console.log('✓ Data sent to printer:', data.length, 'bytes');
      return { success: true };
    } catch (error) {
      console.error('Send error:', error);

      let errorMessage = 'Erreur lors de l\'impression';
      if (error.name === 'NetworkError') {
        errorMessage = 'Imprimante déconnectée';
        this.handleConnectionLost();
      }

      if (this.onError) {
        this.onError(errorMessage);
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Print order ticket
   */
  async printOrderTicket(order, additionalData = {}) {
    try {
      console.log('Printing order ticket:', order.orderNumber);

      const ticketText = formatOrderTicket(order, additionalData);
      console.log('=== TICKET ===');
      console.log(ticketText);
      console.log('==============');

      const printData = this.buildPrintData(ticketText);

      if (!this.getConnectionStatus()) {
        throw new Error('Imprimante non connectée');
      }
      await this.sendToPrinter(printData);

      return { success: true, message: 'Ticket imprimé avec succès' };
    } catch (error) {
      console.error('Print error:', error);
      throw error;
    }
  }

  /**
   * Print test page
   */
  async printTestPage() {
    try {
      console.log('Printing test page...');

      const ticketText = formatTestTicket();
      console.log('=== TEST TICKET ===');
      console.log(ticketText);
      console.log('===================');

      const printData = this.buildPrintData(ticketText);

      if (!this.getConnectionStatus()) {
        throw new Error('Imprimante non connectée');
      }
      await this.sendToPrinter(printData);

      return { success: true, message: 'Test imprimé avec succès' };
    } catch (error) {
      console.error('Test print error:', error);
      throw error;
    }
  }

  // ============================================
  // EVENT HANDLERS
  // ============================================

  setOnConnectionChange(callback) {
    this.onConnectionChange = callback;
  }

  setOnError(callback) {
    this.onError = callback;
  }

  setOnReconnecting(callback) {
    this.onReconnecting = callback;
  }
}

// Export singleton instance
const printerService = new PrinterService();
export default printerService;
