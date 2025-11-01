import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dashboardService } from '../services/firestore';
import { dashboard, status as statusTranslations } from '../utils/translations';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [filterOptions, setFilterOptions] = useState(null);
  const [error, setError] = useState(null);

  // Filter state
  const [filters, setFilters] = useState({
    dateRange: 'thisMonth',
    start_date: '',
    end_date: '',
    caissier: 'all',
    cuisinier: 'all',
    product: 'all',
    status: 'all'
  });

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      setLoading(true);
      return;
    }

    // Don't fetch data if not authenticated
    if (!user) {
      setLoading(false);
      return;
    }

    // Extract restaurantId from JWT token and fetch data
    async function initializeDashboard() {
      try {
        const auth = await import('../config/firebase').then(m => m.auth);
        const idTokenResult = await auth.currentUser.getIdTokenResult();
        const restaurantId = idTokenResult.claims.restaurantId;

        if (!restaurantId) {
          setError('Restaurant ID not found in authentication token');
          setLoading(false);
          return;
        }

        fetchFilterOptions(restaurantId);
        fetchData(filters, restaurantId);
      } catch (err) {
        setError(dashboard.noData.error);
        setLoading(false);
      }
    }

    initializeDashboard();
  }, [authLoading, user]);

  const fetchFilterOptions = async (restaurantId) => {
    try {
      const options = await dashboardService.getFilterOptions(restaurantId);
      setFilterOptions(options);
    } catch (err) {
    }
  };

  const fetchData = async (customFilters = filters, restaurantId = null) => {
    try {
      setLoading(true);
      setError(null);

      // If restaurantId not provided, extract from JWT token
      if (!restaurantId) {
        const auth = await import('../config/firebase').then(m => m.auth);
        const idTokenResult = await auth.currentUser.getIdTokenResult();
        restaurantId = idTokenResult.claims.restaurantId;

        if (!restaurantId) {
          throw new Error('No restaurantId found in auth token');
        }
      }

      // Calculate date range based on selection
      const { start_date, end_date } = calculateDateRange(customFilters.dateRange, customFilters);

      const params = {
        start_date,
        end_date,
        caissier: customFilters.caissier,
        cuisinier: customFilters.cuisinier,
        product: customFilters.product,
        status: customFilters.status,
        restaurantId  // IMPORTANT: Pass restaurantId for multi-tenant filtering
      };

      const statistics = await dashboardService.getStatistics(params);
      setData(statistics);
    } catch (err) {
      setError(dashboard.noData.error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDateRange = (range, customFilters) => {
    const today = new Date();
    let start, end;

    switch (range) {
      case 'today':
        start = end = formatDate(today);
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        start = end = formatDate(yesterday);
        break;
      case 'thisWeek':
        start = formatDate(getStartOfWeek(today));
        end = formatDate(today);
        break;
      case 'thisMonth':
        start = formatDate(new Date(today.getFullYear(), today.getMonth(), 1));
        end = formatDate(today);
        break;
      case 'lastMonth':
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        start = formatDate(lastMonth);
        end = formatDate(new Date(today.getFullYear(), today.getMonth(), 0));
        break;
      case 'custom':
        start = customFilters.start_date;
        end = customFilters.end_date;
        break;
      default:
        const last30Days = new Date(today);
        last30Days.setDate(last30Days.getDate() - 30);
        start = formatDate(last30Days);
        end = formatDate(today);
    }

    return { start_date: start, end_date: end };
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchData(filters);
  };

  const resetFilters = () => {
    const defaultFilters = {
      dateRange: 'thisMonth',
      start_date: '',
      end_date: '',
      caissier: 'all',
      cuisinier: 'all',
      product: 'all',
      status: 'all'
    };
    setFilters(defaultFilters);
    fetchData(defaultFilters);
  };

  const formatCurrency = (amount) => {
    return `${Number(amount).toFixed(2)} ${dashboard.currency}`;
  };

  if (loading && !data) {
    return (
      <div className="flex justify-center items-center py-12">
        <div style={{ color: 'var(--text-primary)' }}>{dashboard.noData.loading}</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex justify-center items-center py-12">
        <div style={{ color: '#ef4444' }}>{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="heading-1" style={{ color: 'var(--text-primary)' }}>
          📊 {dashboard.title}
        </h1>
        <p className="mt-2 text-sm md:text-base" style={{ color: 'var(--text-secondary)' }}>
          {dashboard.subtitle}
        </p>
      </div>

      {/* Filters Panel */}
      <div
        className="rounded-lg p-4 md:p-6"
        style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
      >
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          {dashboard.filters.title}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              {dashboard.filters.dateRange}
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className="w-full px-3 py-2 rounded border"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
                minHeight: '44px'
              }}
            >
              <option value="today">{dashboard.dateRange.today}</option>
              <option value="yesterday">{dashboard.dateRange.yesterday}</option>
              <option value="thisWeek">{dashboard.dateRange.thisWeek}</option>
              <option value="thisMonth">{dashboard.dateRange.thisMonth}</option>
              <option value="lastMonth">{dashboard.dateRange.lastMonth}</option>
              <option value="custom">{dashboard.dateRange.custom}</option>
            </select>
          </div>

          {/* Custom Date Range */}
          {filters.dateRange === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  {dashboard.dateRange.startDate}
                </label>
                <input
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => handleFilterChange('start_date', e.target.value)}
                  className="w-full px-3 py-2 rounded border"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                    minHeight: '44px'
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  {dashboard.dateRange.endDate}
                </label>
                <input
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => handleFilterChange('end_date', e.target.value)}
                  className="w-full px-3 py-2 rounded border"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                    minHeight: '44px'
                  }}
                />
              </div>
            </>
          )}

          {/* Caissier Filter */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              {dashboard.filters.caissier}
            </label>
            <select
              value={filters.caissier}
              onChange={(e) => handleFilterChange('caissier', e.target.value)}
              className="w-full px-3 py-2 rounded border"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
                minHeight: '44px'
              }}
            >
              <option value="all">{dashboard.filters.allCaissiers}</option>
              {filterOptions?.caissiers?.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Cuisinier Filter */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              {dashboard.filters.cuisinier}
            </label>
            <select
              value={filters.cuisinier}
              onChange={(e) => handleFilterChange('cuisinier', e.target.value)}
              className="w-full px-3 py-2 rounded border"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
                minHeight: '44px'
              }}
            >
              <option value="all">{dashboard.filters.allCuisiniers}</option>
              <option value="unassigned">{dashboard.filters.unassigned}</option>
              {filterOptions?.cuisiniers?.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={applyFilters}
            disabled={loading}
            className="px-6 py-2 rounded-lg font-medium transition-colors text-white touch-target"
            style={{
              backgroundColor: loading ? '#9ca3af' : '#dc2626',
              minHeight: '44px'
            }}
          >
            {loading ? dashboard.noData.loading : dashboard.filters.apply}
          </button>
          <button
            onClick={resetFilters}
            disabled={loading}
            className="px-6 py-2 rounded-lg font-medium transition-colors touch-target"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              minHeight: '44px'
            }}
          >
            {dashboard.filters.reset}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              icon="📋"
              value={data.summary.total_orders}
              label={dashboard.summary.totalOrders}
              color="#3b82f6"
            />
            <SummaryCard
              icon="💰"
              value={formatCurrency(data.summary.total_revenue)}
              label={dashboard.summary.totalRevenue}
              color="#10b981"
            />
            <SummaryCard
              icon="🧮"
              value={formatCurrency(data.summary.average_order_value)}
              label={dashboard.summary.averageOrderValue}
              color="#f59e0b"
            />
            <SummaryCard
              icon="✅"
              value={`${data.summary.completed_orders} (${data.summary.completed_percentage}%)`}
              label={dashboard.summary.completedOrders}
              color="#10b981"
            />
          </div>

          {/* Top Products */}
          {data.top_products && data.top_products.length > 0 && (
            <div
              className="rounded-lg p-4 md:p-6"
              style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
            >
              <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                {dashboard.sections.topProducts}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                      <th className="text-left py-2 px-2" style={{ color: 'var(--text-primary)' }}>{dashboard.table.productName}</th>
                      <th className="text-right py-2 px-2" style={{ color: 'var(--text-primary)' }}>{dashboard.table.quantity}</th>
                      <th className="text-right py-2 px-2" style={{ color: 'var(--text-primary)' }}>{dashboard.table.revenue}</th>
                      <th className="text-right py-2 px-2" style={{ color: 'var(--text-primary)' }}>{dashboard.table.percentage}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.top_products.map((product, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td className="py-3 px-2" style={{ color: 'var(--text-primary)' }}>{product.product_name}</td>
                        <td className="text-right py-3 px-2" style={{ color: 'var(--text-primary)' }}>{product.total_quantity}</td>
                        <td className="text-right py-3 px-2" style={{ color: 'var(--text-primary)' }}>{formatCurrency(product.total_revenue)}</td>
                        <td className="text-right py-3 px-2" style={{ color: 'var(--text-primary)' }}>{product.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Orders by Status and Caissier */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Orders by Status */}
            {data.orders_by_status && data.orders_by_status.length > 0 && (
              <div
                className="rounded-lg p-4 md:p-6"
                style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
              >
                <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                  {dashboard.sections.ordersByStatus}
                </h2>
                <div className="space-y-3">
                  {data.orders_by_status.map((item, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between mb-1">
                        <span style={{ color: 'var(--text-primary)' }}>{getStatusLabel(item.status)}</span>
                        <span style={{ color: 'var(--text-primary)' }}>{item.count} ({item.percentage}%)</span>
                      </div>
                      <div
                        className="h-6 rounded"
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                          overflow: 'hidden'
                        }}
                      >
                        <div
                          className="h-full flex items-center px-2 text-white text-sm"
                          style={{
                            width: `${item.percentage}%`,
                            backgroundColor: getStatusColor(item.status),
                            minWidth: item.count > 0 ? '40px' : '0'
                          }}
                        >
                          {item.count}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Orders by Caissier */}
            {data.orders_by_caissier && data.orders_by_caissier.length > 0 && (
              <div
                className="rounded-lg p-4 md:p-6"
                style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
              >
                <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                  {dashboard.sections.ordersByCaissier}
                </h2>
                <div className="space-y-3">
                  {data.orders_by_caissier.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span style={{ color: 'var(--text-primary)' }}>{item.caissier_name}</span>
                      <div className="text-right">
                        <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{item.order_count} commandes</div>
                        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(item.total_revenue)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recent Orders */}
          {data.recent_orders && data.recent_orders.length > 0 && (
            <div
              className="rounded-lg p-4 md:p-6"
              style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
            >
              <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                {dashboard.sections.recentOrders}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                      <th className="text-left py-2 px-2" style={{ color: 'var(--text-primary)' }}>{dashboard.table.orderId}</th>
                      <th className="text-left py-2 px-2" style={{ color: 'var(--text-primary)' }}>{dashboard.table.date}</th>
                      <th className="text-left py-2 px-2" style={{ color: 'var(--text-primary)' }}>{dashboard.table.client}</th>
                      <th className="text-left py-2 px-2" style={{ color: 'var(--text-primary)' }}>{dashboard.table.status}</th>
                      <th className="text-right py-2 px-2" style={{ color: 'var(--text-primary)' }}>{dashboard.table.total}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent_orders.map((order, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td className="py-3 px-2 font-mono text-sm" style={{ color: 'var(--text-primary)' }}>{order.order_id}</td>
                        <td className="py-3 px-2 text-sm" style={{ color: 'var(--text-primary)' }}>{new Date(order.created_at).toLocaleString('fr-FR')}</td>
                        <td className="py-3 px-2" style={{ color: 'var(--text-primary)' }}>{order.client_name}</td>
                        <td className="py-3 px-2">
                          <span
                            className="px-2 py-1 rounded text-xs"
                            style={{
                              backgroundColor: getStatusBgColor(order.status),
                              color: getStatusTextColor(order.status)
                            }}
                          >
                            {getStatusLabel(order.status)}
                          </span>
                        </td>
                        <td className="text-right py-3 px-2 font-semibold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(order.total_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Summary Card Component
function SummaryCard({ icon, value, label, color }) {
  return (
    <div
      className="rounded-lg p-6"
      style={{
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-color)'
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-3xl">{icon}</span>
      </div>
      <div className="text-2xl md:text-3xl font-bold mb-1" style={{ color: color }}>
        {value}
      </div>
      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </div>
    </div>
  );
}

// Status helpers
function getStatusLabel(status) {
  return statusTranslations[status] || status;
}

function getStatusColor(status) {
  const colors = {
    completed: '#10b981',
    preparing: '#3b82f6',
    ready: '#10b981',
    pending: '#f59e0b',
    awaiting_approval: '#f59e0b',
    cancelled: '#ef4444',
    rejected: '#ef4444'
  };
  return colors[status] || '#6b7280';
}

function getStatusBgColor(status) {
  const colors = {
    completed: '#dcfce7',
    preparing: '#dbeafe',
    ready: '#dcfce7',
    pending: '#fef3c7',
    awaiting_approval: '#fef3c7',
    cancelled: '#fee2e2',
    rejected: '#fee2e2'
  };
  return colors[status] || '#f3f4f6';
}

function getStatusTextColor(status) {
  const colors = {
    completed: '#166534',
    preparing: '#1e40af',
    ready: '#166534',
    pending: '#92400e',
    awaiting_approval: '#92400e',
    cancelled: '#991b1b',
    rejected: '#991b1b'
  };
  return colors[status] || '#374151';
}
