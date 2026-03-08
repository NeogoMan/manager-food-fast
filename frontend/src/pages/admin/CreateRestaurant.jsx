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
    plan: 'standard',
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
            Abonnement
          </h3>
          {plans.map((plan) => (
            <div
              key={plan.id}
              style={{
                border: '2px solid #10b981',
                borderRadius: '8px',
                padding: '20px',
                backgroundColor: '#f0fdf4',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#333', marginBottom: '4px' }}>
                    {plan.name}
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: '#10b981' }}>
                    {plan.price} MAD
                    <span style={{ fontSize: '14px', fontWeight: 400, color: '#666' }}>/mois</span>
                  </div>
                </div>
                <div style={{
                  backgroundColor: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>Annuel</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#10b981' }}>
                    {plan.annualPrice.toLocaleString()} MAD<span style={{ fontSize: '12px', fontWeight: 400 }}>/an</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#059669' }}>332 MAD/mois — 2 mois offerts</div>
                </div>
              </div>
              <ul style={{ margin: 0, padding: '0 0 0 20px', fontSize: '13px', color: '#555', columns: 2 }}>
                {plan.features.map((feature, index) => (
                  <li key={index} style={{ marginBottom: '6px' }}>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
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
