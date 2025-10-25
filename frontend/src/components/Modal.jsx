import { useEffect } from 'react';

/**
 * Reusable Modal component with theme support
 */
export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'sm:max-w-md',
    md: 'sm:max-w-2xl',
    lg: 'sm:max-w-4xl',
    xl: 'sm:max-w-6xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
        <div
          className={`relative w-full ${sizeClasses[size]} rounded-t-xl sm:rounded-xl shadow-2xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto`}
          style={{ backgroundColor: 'var(--bg-primary)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between p-4 sm:p-6 sticky top-0 z-10"
            style={{
              borderBottom: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)'
            }}
          >
            <h2 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {title}
            </h2>
            <button
              onClick={onClose}
              className="transition-colors touch-target p-2"
              style={{ color: 'var(--text-tertiary)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
              aria-label="Close modal"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
