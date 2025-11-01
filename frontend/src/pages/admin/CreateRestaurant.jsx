import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRestaurant, getPlanDetails } from '../../services/restaurantService';

const CreateRestaurant = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    plan: 'pro',
    createAdminUser: true,
    adminUsername: '',
    adminPassword: '',
    adminName: '',
    adminEmail: '',
    adminPhone: '',
  });

  const plans = getPlanDetails();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const restaurantData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        address: formData.address || null,
        plan: formData.plan,
      };

      // Add admin user if checkbox is checked
      if (formData.createAdminUser) {
        restaurantData.adminUser = {
          username: formData.adminUsername,
          password: formData.adminPassword,
          name: formData.adminName,
          email: formData.adminEmail || formData.email,
          phone: formData.adminPhone || formData.phone,
        };
      }

      const result = await createRestaurant(restaurantData);

      alert(`Restaurant created successfully!\nRestaurant Code: ${result.restaurantCode}`);
      navigate('/admin/restaurants');
    } catch (err) {
      console.error('Error creating restaurant:', err);
      setError(err.message || 'Failed to create restaurant');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => navigate('/admin/restaurants')}
          style={{
            background: 'none',
            border: 'none',
            color: '#666',
            fontSize: '14px',
            cursor: 'pointer',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          ← Back to Restaurants
        </button>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 600, color: '#333' }}>
          Create New Restaurant
        </h2>
        <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
          Set up a new restaurant with subscription plan
        </p>
      </div>

      {/* Error Message */}
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

      <form onSubmit={handleSubmit}>
        {/* Restaurant Information */}
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600, color: '#333' }}>
            Restaurant Information
          </h3>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#333' }}>
                Restaurant Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#333' }}>
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#333' }}>
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#333' }}>
                Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>
          </div>
        </div>

        {/* Subscription Plan */}
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600, color: '#333' }}>
            Subscription Plan *
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {plans.map((plan) => (
              <label
                key={plan.id}
                style={{
                  position: 'relative',
                  cursor: 'pointer',
                  border: `2px solid ${formData.plan === plan.id ? '#FF5722' : '#e0e0e0'}`,
                  borderRadius: '8px',
                  padding: '16px',
                  backgroundColor: formData.plan === plan.id ? '#fff5f3' : 'white',
                  transition: 'all 0.2s',
                }}
              >
                {plan.popular && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-10px',
                      right: '10px',
                      backgroundColor: '#FF5722',
                      color: 'white',
                      fontSize: '10px',
                      fontWeight: 600,
                      padding: '4px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    POPULAR
                  </div>
                )}
                <input
                  type="radio"
                  name="plan"
                  value={plan.id}
                  checked={formData.plan === plan.id}
                  onChange={handleChange}
                  style={{ marginBottom: '8px' }}
                />
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#333', marginBottom: '4px' }}>
                  {plan.name}
                </div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#FF5722', marginBottom: '12px' }}>
                  ${plan.price}
                  <span style={{ fontSize: '14px', fontWeight: 400, color: '#666' }}>/month</span>
                </div>
                <ul style={{ margin: 0, padding: '0 0 0 20px', fontSize: '12px', color: '#666' }}>
                  {plan.features.map((feature, index) => (
                    <li key={index} style={{ marginBottom: '4px' }}>
                      {feature}
                    </li>
                  ))}
                </ul>
              </label>
            ))}
          </div>
        </div>

        {/* Admin User (Optional) */}
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <input
              type="checkbox"
              name="createAdminUser"
              checked={formData.createAdminUser}
              onChange={handleChange}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#333' }}>
              Create Admin User
            </h3>
          </div>
          {formData.createAdminUser && (
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#333' }}>
                  Username *
                </label>
                <input
                  type="text"
                  name="adminUsername"
                  value={formData.adminUsername}
                  onChange={handleChange}
                  required={formData.createAdminUser}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#333' }}>
                  Password *
                </label>
                <input
                  type="password"
                  name="adminPassword"
                  value={formData.adminPassword}
                  onChange={handleChange}
                  required={formData.createAdminUser}
                  minLength={6}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
                <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 0 0' }}>
                  Minimum 6 characters
                </p>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#333' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  name="adminName"
                  value={formData.adminName}
                  onChange={handleChange}
                  required={formData.createAdminUser}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => navigate('/admin/restaurants')}
            disabled={loading}
            style={{
              padding: '12px 24px',
              backgroundColor: '#f3f4f6',
              color: '#333',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px 24px',
              backgroundColor: '#FF5722',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading ? 'Creating...' : 'Create Restaurant'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateRestaurant;
