/**
 * Toast Notification Component - Shows temporary notification messages
 */

import { useState, useEffect } from 'react';

export default function Toast({ message, type = 'info', duration = 4000, onClose }) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, duration - 300); // Start exit animation before closing

    const closeTimer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(closeTimer);
    };
  }, [duration, onClose]);

  if (!isVisible) return null;

  const typeStyles = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    warning: 'bg-yellow-500 text-white',
    info: 'bg-blue-500 text-white',
    order: 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-2xl'
  };

  const animationClass = isExiting
    ? 'animate-slide-out-right opacity-0'
    : 'animate-slide-in-right';

  return (
    <div
      className={`
        fixed top-24 right-6 z-50
        px-6 py-4 rounded-lg shadow-lg
        ${typeStyles[type] || typeStyles.info}
        ${animationClass}
        transition-all duration-300
        max-w-md
      `}
      style={{
        animation: isExiting
          ? 'slideOutRight 0.3s ease-out'
          : 'slideInRight 0.3s ease-out'
      }}
    >
      <div className="flex items-start gap-3">
        {type === 'order' && (
          <div className="text-3xl animate-bounce">🔔</div>
        )}
        {type === 'success' && (
          <div className="text-2xl">✅</div>
        )}
        {type === 'error' && (
          <div className="text-2xl">❌</div>
        )}
        {type === 'warning' && (
          <div className="text-2xl">⚠️</div>
        )}
        {type === 'info' && (
          <div className="text-2xl">ℹ️</div>
        )}

        <div className="flex-1">
          <div className="font-semibold text-lg">{message.title}</div>
          {message.body && (
            <div className="text-sm opacity-90 mt-1">{message.body}</div>
          )}
        </div>

        <button
          onClick={() => {
            setIsExiting(true);
            setTimeout(() => {
              setIsVisible(false);
              onClose?.();
            }, 300);
          }}
          className="text-white hover:opacity-75 transition-opacity"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

/**
 * ToastContainer - Manages multiple toast notifications
 */
export function ToastContainer({ toasts = [], onRemove }) {
  return (
    <div className="fixed top-20 right-0 z-50 p-4 space-y-3 pointer-events-none">
      {toasts.map((toast, index) => (
        <div key={toast.id || index} className="pointer-events-auto">
          <Toast
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => onRemove?.(toast.id || index)}
          />
        </div>
      ))}
    </div>
  );
}

// Add CSS animations to index.css or global styles
const styles = `
@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOutRight {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}
`;

// You can add these styles to your global CSS file
