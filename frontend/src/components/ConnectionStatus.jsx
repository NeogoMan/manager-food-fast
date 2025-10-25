/**
 * ConnectionStatus Component - Displays WebSocket connection status
 */

import { useSocket } from '../hooks/useSocket';

export default function ConnectionStatus() {
  const { isConnected, connectionStatus } = useSocket();

  // Don't show anything if connected (to reduce clutter)
  if (isConnected && !connectionStatus.reconnecting) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Connecté
        </span>
      </div>
    );
  }

  // Show reconnecting status
  if (connectionStatus.reconnecting) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 dark:bg-yellow-900 rounded-full">
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-ping"></div>
        <span className="text-sm text-yellow-800 dark:text-yellow-200">
          Reconnexion... ({connectionStatus.attempt || 0}/10)
        </span>
      </div>
    );
  }

  // Show disconnected status
  if (!isConnected) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-red-100 dark:bg-red-900 rounded-full">
        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
        <span className="text-sm text-red-800 dark:text-red-200">
          Déconnecté
        </span>
      </div>
    );
  }

  return null;
}
