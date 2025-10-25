import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../utils/translations';
import Button from '../components/Button';

export default function Login() {
  const navigate = useNavigate();
  const { user, login, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in
  if (user) {
    // Redirect based on role
    const roleRedirects = {
      manager: '/',
      cashier: '/menu',
      cook: '/kitchen',
      client: '/customer-menu',
    };
    return <Navigate to={roleRedirects[user.role] || '/'} replace />;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.username || !formData.password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);

    try {
      await login(formData.username, formData.password);
      // Redirect will happen automatically via the Navigate component above
    } catch (error) {
      setError(error.message || 'Échec de la connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div style={{ color: 'var(--text-primary)' }}>Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            🍔 Fast Food Manager
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            Système de gestion de restaurant
          </p>
        </div>

        {/* Login Card */}
        <div
          className="rounded-lg shadow-lg p-8"
          style={{ backgroundColor: 'var(--bg-primary)' }}
        >
          <h2 className="text-2xl font-semibold mb-6 text-center" style={{ color: 'var(--text-primary)' }}>
            {auth.login}
          </h2>

          {error && (
            <div
              className="mb-4 p-3 rounded"
              style={{
                backgroundColor: '#fee',
                color: '#c00',
                border: '1px solid #fcc'
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--text-primary)' }}
              >
                {auth.username}
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-orange-500"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)'
                }}
                placeholder="Entrez votre nom d'utilisateur"
                autoComplete="username"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--text-primary)' }}
              >
                {auth.password}
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-orange-500"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)'
                }}
                placeholder="Entrez votre mot de passe"
                autoComplete="current-password"
                required
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full py-3 mt-6"
              disabled={loading}
            >
              {loading ? 'Connexion...' : auth.signIn}
            </Button>
          </form>

          {/* Default Credentials Info (for development) */}
          <div className="mt-6 p-4 rounded" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <p className="text-xs text-center" style={{ color: 'var(--text-secondary)' }}>
              Compte par défaut : <strong>admin</strong> / <strong>Admin123!</strong>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            © 2024 Fast Food Manager
          </p>
        </div>
      </div>
    </div>
  );
}
