import { useState } from 'react';
import { approval } from '../utils/translations';

export default function ApprovalNotification({ orders, onApprove, onReject }) {
  const [loading, setLoading] = useState(null);

  if (!orders || orders.length === 0) return null;

  const handleApprove = async (orderId) => {
    setLoading(orderId);
    try {
      await onApprove(orderId);
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async (orderId) => {
    setLoading(orderId);
    try {
      await onReject(orderId);
    } finally {
      setLoading(null);
    }
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const created = new Date(dateString);
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `${approval.minutesAgo} ${diffMins} ${approval.minutes}`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${approval.minutesAgo} ${diffHours}h`;
    return `${approval.minutesAgo} ${Math.floor(diffHours / 24)}j`;
  };

  return (
    <div
      className="fixed top-4 right-4 z-50 w-96 max-h-[80vh] overflow-y-auto space-y-3"
      style={{ zIndex: 9999 }}
    >
      {orders.map((order) => (
        <div
          key={order.id}
          className="rounded-lg p-4 shadow-2xl animate-pulse-border"
          style={{
            backgroundColor: 'var(--bg-primary)',
            border: '2px solid #f59e0b',
            boxShadow: '0 0 20px rgba(245, 158, 11, 0.5)',
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🔔</span>
                <h3
                  className="font-bold text-lg"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {approval.newClientOrder}
                </h3>
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                {getTimeAgo(order.createdAt)}
              </p>
            </div>
          </div>

          {/* Order Details */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span
                className="text-sm font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                {approval.client}:
              </span>
              <span
                className="text-sm font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                {order.customerName || 'Client'}
              </span>
            </div>
            <div className="flex justify-between">
              <span
                className="text-sm font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                {approval.order}:
              </span>
              <span
                className="text-sm font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                {order.orderNumber || `#${order.id}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span
                className="text-sm font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                {order.items?.length || 0} {approval.items}
              </span>
              <span
                className="text-lg font-bold"
                style={{ color: '#f59e0b' }}
              >
                {order.totalAmount?.toFixed(2) || '0.00'} MAD
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={() => handleApprove(order.id)}
              disabled={loading === order.id}
              className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors text-white"
              style={{
                backgroundColor: loading === order.id ? '#9ca3af' : '#10b981',
                cursor: loading === order.id ? 'not-allowed' : 'pointer',
              }}
              onMouseOver={(e) => !loading && (e.target.style.backgroundColor = '#059669')}
              onMouseOut={(e) => !loading && (e.target.style.backgroundColor = '#10b981')}
            >
              {loading === order.id ? '...' : `✓ ${approval.accept}`}
            </button>
            <button
              onClick={() => handleReject(order.id)}
              disabled={loading === order.id}
              className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors text-white"
              style={{
                backgroundColor: loading === order.id ? '#9ca3af' : '#ef4444',
                cursor: loading === order.id ? 'not-allowed' : 'pointer',
              }}
              onMouseOver={(e) => !loading && (e.target.style.backgroundColor = '#dc2626')}
              onMouseOut={(e) => !loading && (e.target.style.backgroundColor = '#ef4444')}
            >
              {loading === order.id ? '...' : `✕ ${approval.reject}`}
            </button>
          </div>
        </div>
      ))}

      <style jsx>{`
        @keyframes pulse-border {
          0%, 100% {
            border-color: #f59e0b;
          }
          50% {
            border-color: #fbbf24;
          }
        }
        .animate-pulse-border {
          animation: pulse-border 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
