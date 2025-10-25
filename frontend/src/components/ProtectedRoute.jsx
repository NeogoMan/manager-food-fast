import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * ProtectedRoute component - Protects routes based on authentication and role
 * @param {Object} props
 * @param {ReactNode} props.children - Child components to render
 * @param {string[]} props.allowedRoles - Array of roles allowed to access this route
 */
export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div style={{ color: 'var(--text-primary)' }}>
          Chargement...
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate page based on user's role
    const roleRedirects = {
      manager: '/',
      cashier: '/menu',
      cook: '/kitchen',
      client: '/customer-menu',
    };

    return <Navigate to={roleRedirects[user.role] || '/'} replace />;
  }

  // User is authenticated and has required role
  return children;
}
