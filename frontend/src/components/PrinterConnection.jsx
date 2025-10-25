/**
 * PrinterConnection Component
 * Handles auto-reconnection on app load and provides connection UI
 */

import { useState, useEffect } from 'react';
import Button from './Button';
import printerService from '../services/printerService';

export default function PrinterConnection() {
  const [connectionState, setConnectionState] = useState('checking'); // checking, connected, disconnected, reconnecting, connecting, error
  const [savedPrinterName, setSavedPrinterName] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Auto-reconnect on component mount
  useEffect(() => {
    attemptAutoReconnect();

    // Set up event handlers
    printerService.setOnConnectionChange((connected) => {
      setConnectionState(connected ? 'connected' : 'disconnected');
      if (!connected) {
        setErrorMessage(null);
      }
    });

    printerService.setOnReconnecting((reconnecting) => {
      if (reconnecting) {
        setConnectionState('reconnecting');
      }
    });

    printerService.setOnError((error) => {
      setErrorMessage(error);
      setConnectionState('error');
    });

    return () => {
      // Cleanup
      printerService.setOnConnectionChange(null);
      printerService.setOnReconnecting(null);
      printerService.setOnError(null);
    };
  }, []);

  /**
   * Attempt automatic reconnection on load
   */
  const attemptAutoReconnect = async () => {
    setConnectionState('checking');
    const savedName = printerService.getSavedPrinterName();
    setSavedPrinterName(savedName);

    if (!savedName) {
      // No saved printer, show disconnected state
      setConnectionState('disconnected');
      return;
    }

    // Try to auto-reconnect
    try {
      const result = await printerService.autoReconnect();

      if (result.success) {
        setConnectionState('connected');
        setErrorMessage(null);
      } else {
        // Auto-reconnect failed, but we have a saved printer
        // Show quick reconnect option
        setConnectionState('disconnected');
      }
    } catch (error) {
      console.error('Auto-reconnect error:', error);
      setConnectionState('disconnected');
    }
  };

  /**
   * Manual connection (first time)
   */
  const handleConnect = async () => {
    setIsConnecting(true);
    setConnectionState('connecting');
    setErrorMessage(null);

    try {
      await printerService.connect();
      setSavedPrinterName(printerService.getSavedPrinterName());
      setConnectionState('connected');
    } catch (error) {
      console.error('Connection error:', error);
      setErrorMessage(error.message);
      setConnectionState('error');
    } finally {
      setIsConnecting(false);
    }
  };

  /**
   * Quick reconnect (after disconnection)
   */
  const handleReconnect = async () => {
    setIsConnecting(true);
    setConnectionState('reconnecting');
    setErrorMessage(null);

    try {
      const result = await printerService.autoReconnect();

      if (result.success) {
        setConnectionState('connected');
      } else {
        // If auto-reconnect fails, try manual reconnect
        await printerService.connect();
        setSavedPrinterName(printerService.getSavedPrinterName());
        setConnectionState('connected');
      }
    } catch (error) {
      console.error('Reconnect error:', error);
      setErrorMessage(error.message);
      setConnectionState('error');
    } finally {
      setIsConnecting(false);
    }
  };

  /**
   * Forget printer and disconnect
   */
  const handleForget = () => {
    if (confirm('Oublier cette imprimante? Vous devrez la reconnecter manuellement.')) {
      printerService.forgetPrinter();
      setSavedPrinterName(null);
      setConnectionState('disconnected');
      setErrorMessage(null);
    }
  };

  /**
   * Get status color based on connection state
   */
  const getStatusColor = () => {
    switch (connectionState) {
      case 'connected':
        return '#10b981'; // Green
      case 'connecting':
      case 'reconnecting':
      case 'checking':
        return '#f59e0b'; // Yellow
      case 'disconnected':
      case 'error':
      default:
        return '#ef4444'; // Red
    }
  };

  /**
   * Get status text based on connection state
   */
  const getStatusText = () => {
    switch (connectionState) {
      case 'checking':
        return 'Vérification...';
      case 'connected':
        return `Connecté: ${savedPrinterName || 'Imprimante'}`;
      case 'connecting':
        return 'Connexion...';
      case 'reconnecting':
        return 'Reconnexion...';
      case 'disconnected':
        return savedPrinterName
          ? `Déconnecté (${savedPrinterName})`
          : 'Imprimante non connectée';
      case 'error':
        return 'Erreur de connexion';
      default:
        return 'Statut inconnu';
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Status Indicator */}
      <div className="flex items-center gap-3">
        {/* Status Dot */}
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: getStatusColor() }}
        />

        {/* Status Text */}
        <span
          className="text-sm font-medium flex-1"
          style={{ color: 'var(--text-secondary)' }}
        >
          {getStatusText()}
        </span>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {connectionState === 'disconnected' && savedPrinterName && (
            <>
              {/* Quick Reconnect Button */}
              <Button
                size="sm"
                onClick={handleReconnect}
                disabled={isConnecting}
              >
                {isConnecting ? 'Reconnexion...' : 'Reconnecter'}
              </Button>
              {/* Forget Button */}
              <Button
                size="sm"
                variant="secondary"
                onClick={handleForget}
              >
                Oublier
              </Button>
            </>
          )}

          {connectionState === 'disconnected' && !savedPrinterName && (
            /* First-time Connection */
            <Button
              size="sm"
              onClick={handleConnect}
              disabled={isConnecting}
            >
              {isConnecting ? 'Connexion...' : 'Connecter l\'imprimante'}
            </Button>
          )}

          {connectionState === 'error' && (
            /* Retry Button */
            <Button
              size="sm"
              onClick={savedPrinterName ? handleReconnect : handleConnect}
              disabled={isConnecting}
            >
              Réessayer
            </Button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div
          className="text-sm px-3 py-2 rounded-lg"
          style={{
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            border: '1px solid #fca5a5',
          }}
        >
          <strong>Erreur:</strong> {errorMessage}
        </div>
      )}

      {/* Help Text for Disconnected State */}
      {connectionState === 'disconnected' && savedPrinterName && !errorMessage && (
        <div
          className="text-xs px-3 py-2 rounded-lg"
          style={{
            backgroundColor: '#fef3c7',
            color: '#92400e',
            border: '1px solid #fde68a',
          }}
        >
          💡 Imprimante précédemment connectée. Cliquez sur "Reconnecter" pour reconnecter.
        </div>
      )}
    </div>
  );
}
