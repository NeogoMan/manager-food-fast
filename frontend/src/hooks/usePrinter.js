import printerService from '../services/printerService';

/**
 * Custom hook to access printer service
 */
export const usePrinter = () => {
  const printTestTicket = async (type = 'receipt') => {
    try {
      await printerService.printTestPage();
      return { success: true };
    } catch (error) {
      console.error('Error printing test ticket:', error);
      throw error;
    }
  };

  const printOrderTicket = async (order, additionalData = {}) => {
    try {
      await printerService.printOrderTicket(order, additionalData);
      return { success: true };
    } catch (error) {
      console.error('Error printing order ticket:', error);
      throw error;
    }
  };

  const connect = async () => {
    try {
      const result = await printerService.connect();
      return result;
    } catch (error) {
      console.error('Error connecting to printer:', error);
      throw error;
    }
  };

  const disconnect = () => {
    printerService.disconnect();
  };

  const getConnectionStatus = () => {
    return printerService.getConnectionStatus();
  };

  return {
    printTestTicket,
    printOrderTicket,
    connect,
    disconnect,
    getConnectionStatus
  };
};
