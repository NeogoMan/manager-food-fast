import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/Button';

export default function PlatformAdminLogin() {
  const navigate = useNavigate();
  const { user, loginSuperAdmin, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in as super admin
  if (user && user.isSuperAdmin === true) {
    return <Navigate to="/admin/restaurants" replace />;
  }

  // Redirect restaurant users to their login
  if (user && !user.isSuperAdmin) {
    const roleRedirects = {
      manager: '/',
      cashier: '/menu',
      cook: '/kitchen',
      client: '/customer-menu',
    };
    return <Navigate to={roleRedirects[user.role] || '/login'} replace />;
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
      await loginSuperAdmin(formData.username, formData.password);
      // Redirect will happen automatically via the Navigate component above
    } catch (error) {
      console.error('Super admin login error:', error);
      setError(error.message || 'Échec de la connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f7fa' }}>
        <div style={{ color: '#1e293b' }}>Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#f5f7fa' }}>
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#1e293b' }}>
            🏢 Platform Admin
          </h1>
          <p className="text-lg" style={{ color: '#64748b' }}>
            Manage all restaurants and subscriptions
          </p>
        </div>

        {/* Login Card */}
        <div
          className="rounded-lg shadow-lg p-8"
          style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}
        >
          <h2 className="text-2xl font-semibold mb-6 text-center" style={{ color: '#1e293b' }}>
            Connexion Administrateur
          </h2>

          {/* Security Notice */}
          <div
            className="mb-6 p-4 rounded-lg"
            style={{
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              color: '#1e40af'
            }}
          >
            <div className="flex items-start gap-2">
              <span className="text-xl">🔒</span>
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Accès Sécurisé</p>
                <p className="text-xs" style={{ color: '#3b82f6' }}>
                  Cette interface est réservée aux administrateurs de la plateforme.
                  Toutes les connexions sont enregistrées et surveillées.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div
              className="mb-4 p-3 rounded"
              style={{
                backgroundColor: '#fee2e2',
                color: '#991b1b',
                border: '1px solid #fecaca'
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
                style={{ color: '#1e293b' }}
              >
                Nom d'utilisateur
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded border focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: '#f8fafc',
                  borderColor: '#cbd5e1',
                  color: '#1e293b',
                  focusRingColor: '#3b82f6'
                }}
                placeholder="Entrez votre nom d'utilisateur"
                autoComplete="username"
                required
                autoFocus
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-1"
                style={{ color: '#1e293b' }}
              >
                Mot de passe
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded border focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: '#f8fafc',
                  borderColor: '#cbd5e1',
                  color: '#1e293b',
                  focusRingColor: '#3b82f6'
                }}
                placeholder="Entrez votre mot de passe"
                autoComplete="current-password"
                required
              />
            </div>

            {/* Password Requirements Info */}
            <div
              className="text-xs p-3 rounded"
              style={{
                backgroundColor: '#f8fafc',
                color: '#64748b',
                border: '1px solid #e2e8f0'
              }}
            >
              <p className="font-medium mb-1" style={{ color: '#475569' }}>Exigences de sécurité:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>12+ caractères minimum</li>
                <li>Majuscules et minuscules</li>
                <li>Chiffres et caractères spéciaux</li>
              </ul>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full py-3 mt-6"
              style={{
                backgroundColor: '#3b82f6',
                color: '#ffffff'
              }}
              disabled={loading}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>

          {/* Restaurant Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm" style={{ color: '#64748b' }}>
              Vous êtes un gestionnaire de restaurant?{' '}
              <button
                onClick={() => navigate('/login')}
                className="font-medium hover:underline"
                style={{ color: '#3b82f6' }}
                type="button"
              >
                Connexion restaurant
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm" style={{ color: '#94a3b8' }}>
            © 2024 Fast Food Manager - Platform Administration
          </p>
        </div>
      </div>
    </div>
  );
}
