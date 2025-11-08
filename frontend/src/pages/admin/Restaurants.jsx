import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listRestaurants, suspendRestaurant, toggleRestaurantOrders } from '../../services/restaurantService';

const Restaurants = () => {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listRestaurants();
      setRestaurants(data);
    } catch (err) {
      setError(err.message || 'Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (restaurantId, newStatus) => {
    try {
      await suspendRestaurant(restaurantId, newStatus);
      await loadRestaurants(); // Reload list
    } catch (err) {
      alert('Failed to update restaurant status');
    }
  };

  const handleToggleOrders = async (restaurantId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await toggleRestaurantOrders(restaurantId, newStatus);
      await loadRestaurants(); // Reload list
    } catch (err) {
      alert('Failed to toggle order acceptance: ' + err.message);
    }
  };

  const getPlanBadgeColor = (plan) => {
    switch (plan) {
      case 'basic':
        return '#94a3b8';
      case 'pro':
        return '#3b82f6';
      case 'enterprise':
        return '#8b5cf6';
      default:
        return '#6b7280';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'active':
        return '#10b981';
      case 'suspended':
        return '#f59e0b';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const filteredRestaurants = restaurants.filter((restaurant) => {
    const matchesSearch =
      restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || restaurant.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div>
      {/* Header Section */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 600, color: '#333' }}>
            Restaurants
          </h2>
          <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
            Manage all restaurants and subscriptions
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/restaurants/new')}
          style={{
            padding: '12px 24px',
            backgroundColor: '#FF5722',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '18px' }}>+</span>
          New Restaurant
        </button>
      </div>

      {/* Filters */}
      <div
        style={{
          backgroundColor: 'white',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
        }}
      >
        <input
          type="text"
          placeholder="Search restaurants..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            padding: '10px 16px',
            border: '1px solid #e0e0e0',
            borderRadius: '6px',
            fontSize: '14px',
          }}
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: '10px 16px',
            border: '1px solid #e0e0e0',
            borderRadius: '6px',
            fontSize: '14px',
            backgroundColor: 'white',
            cursor: 'pointer',
          }}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          Loading restaurants...
        </div>
      )}

      {/* Error State */}
      {error && (
        <div
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '20px',
          }}
        >
          {error}
        </div>
      )}

      {/* Restaurants List */}
      {!loading && !error && (
        <div style={{ display: 'grid', gap: '16px' }}>
          {filteredRestaurants.length === 0 ? (
            <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{ color: '#666', margin: 0 }}>No restaurants found</p>
            </div>
          ) : (
            filteredRestaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                style={{
                  backgroundColor: 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0',
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: '20px',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#333' }}>
                      {restaurant.name}
                    </h3>
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 500,
                        backgroundColor: getPlanBadgeColor(restaurant.plan),
                        color: 'white',
                      }}
                    >
                      {restaurant.plan.toUpperCase()}
                    </span>
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 500,
                        backgroundColor: getStatusBadgeColor(restaurant.status),
                        color: 'white',
                      }}
                    >
                      {restaurant.status.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                    📧 {restaurant.email}
                    {restaurant.phone && ` • 📞 ${restaurant.phone}`}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    Code: {restaurant.restaurantCode} • Created:{' '}
                    {new Date(restaurant.createdAt?.seconds * 1000).toLocaleDateString('fr-FR')}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                    📊 {restaurant.usage?.totalOrders || 0} orders • 👥 {restaurant.usage?.activeStaffUsers || 0}{' '}
                    staff
                  </div>
                  {/* Order Acceptance Toggle */}
                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: restaurant.acceptingOrders !== false ? '#15803d' : '#b91c1c', fontWeight: 500 }}>
                      {restaurant.acceptingOrders !== false ? '✓ Accepting Orders' : '⏸ Orders Paused'}
                    </span>
                    <button
                      onClick={() => handleToggleOrders(restaurant.id, restaurant.acceptingOrders !== false)}
                      style={{
                        position: 'relative',
                        display: 'inline-flex',
                        height: '20px',
                        width: '36px',
                        alignItems: 'center',
                        borderRadius: '10px',
                        backgroundColor: restaurant.acceptingOrders !== false ? '#22c55e' : '#ef4444',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-block',
                          height: '14px',
                          width: '14px',
                          borderRadius: '50%',
                          backgroundColor: 'white',
                          transition: 'transform 0.2s',
                          transform: restaurant.acceptingOrders !== false ? 'translateX(19px)' : 'translateX(3px)',
                        }}
                      />
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => navigate(`/admin/restaurants/${restaurant.id}`)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#f3f4f6',
                      color: '#333',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: 'pointer',
                    }}
                  >
                    Edit
                  </button>
                  {restaurant.status === 'active' ? (
                    <button
                      onClick={() => handleStatusChange(restaurant.id, 'suspended')}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#fef3c7',
                        color: '#92400e',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        cursor: 'pointer',
                      }}
                    >
                      Suspend
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStatusChange(restaurant.id, 'active')}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#d1fae5',
                        color: '#065f46',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        cursor: 'pointer',
                      }}
                    >
                      Activate
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Restaurants;
