import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from './ThemeToggle';
import { appName, nav, auth, users, orders } from '../utils/translations';

/**
 * Navigation bar component with role-based navigation
 */
export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Fullscreen handlers
  const enterFullscreen = useCallback(() => {
    const elem = document.documentElement; // Make entire page fullscreen
    if (elem) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
      setIsFullscreen(true);
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
    setIsFullscreen(false);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Define navigation links based on role
  const getNavLinks = () => {
    if (!user) return [];

    const links = {
      manager: [
        { path: '/dashboard', label: nav.dashboard, icon: '📊' },
        { path: '/', label: nav.orders, icon: '📋' },
        { path: '/orders-history', label: orders.orderHistory, icon: '📜' },
        { path: '/menu', label: nav.menu, icon: '🍔' },
        { path: '/kitchen', label: nav.kitchen, icon: '👨‍🍳' },
        { path: '/users', label: users.users, icon: '👥' },
      ],
      cashier: [
        { path: '/', label: nav.orders, icon: '📋' },
        { path: '/orders-history', label: orders.orderHistory, icon: '📜' },
        { path: '/menu', label: nav.menu, icon: '🍔' },
      ],
      cook: [
        { path: '/kitchen', label: nav.kitchen, icon: '👨‍🍳' },
      ],
      client: [
        { path: '/customer-menu', label: 'Menu', icon: '🍔' },
        { path: '/my-orders', label: 'Mes Commandes', icon: '📦' },
      ],
    };

    return links[user.role] || [];
  };

  const navLinks = getNavLinks();

  // Get role display name
  const getRoleLabel = (role) => {
    const roleLabels = {
      manager: users.manager,
      cashier: users.cashier,
      cook: users.cook,
      client: users.client,
    };
    return roleLabels[role] || role;
  };

  return (
    <nav style={{ backgroundColor: 'var(--bg-primary)', boxShadow: '0 4px 6px -1px var(--shadow)' }}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl">🍟</span>
            <span className="text-xl font-bold text-primary-600">
              {appName}
            </span>
          </Link>

          {/* Desktop Navigation Links - Hidden on Mobile */}
          <div className="hidden md:flex space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`
                  px-4 py-2 rounded-lg font-medium transition-colors duration-200
                  ${
                    isActive(link.path)
                      ? 'bg-primary-600 text-white'
                      : ''
                  }
                `}
                style={!isActive(link.path) ? {
                  color: 'var(--text-primary)',
                  ':hover': { backgroundColor: 'var(--hover-bg)' }
                } : {}}
              >
                <span className="mr-2">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Side - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {/* User Info */}
            {user && (
              <div className="flex items-center space-x-2" style={{ color: 'var(--text-primary)' }}>
                <div className="text-right">
                  <div className="text-sm font-medium">{user.name}</div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {getRoleLabel(user.role)}
                  </div>
                </div>
              </div>
            )}

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg transition-colors duration-200"
              style={{ color: 'var(--text-primary)' }}
              onMouseOver={(e) => e.target.style.backgroundColor = 'var(--hover-bg)'}
              onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
              title={isFullscreen ? 'Quitter plein écran' : 'Plein écran'}
            >
              <span className="text-xl">{isFullscreen ? '⊗' : '⛶'}</span>
            </button>

            {/* Logout Button */}
            {user && (
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg font-medium transition-colors duration-200 touch-target"
                style={{
                  backgroundColor: '#ef4444',
                  color: 'white'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#dc2626'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#ef4444'}
              >
                {auth.logout}
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-2">
            <ThemeToggle />
            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg touch-target"
              style={{ color: 'var(--text-primary)' }}
              title={isFullscreen ? 'Quitter plein écran' : 'Plein écran'}
            >
              <span className="text-xl">{isFullscreen ? '⊗' : '⛶'}</span>
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg touch-target"
              style={{ color: 'var(--text-primary)' }}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div
            className="md:hidden py-4 border-t"
            style={{ borderColor: 'var(--border-color)' }}
          >
            {/* Mobile Navigation Links */}
            <div className="space-y-2 mb-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    flex items-center px-4 py-3 rounded-lg font-medium transition-colors duration-200 touch-target
                    ${
                      isActive(link.path)
                        ? 'bg-primary-600 text-white'
                        : ''
                    }
                  `}
                  style={!isActive(link.path) ? {
                    color: 'var(--text-primary)',
                    backgroundColor: isActive(link.path) ? undefined : 'var(--bg-secondary)'
                  } : {}}
                >
                  <span className="text-2xl mr-3">{link.icon}</span>
                  <span className="text-base">{link.label}</span>
                </Link>
              ))}
            </div>

            {/* Mobile User Info */}
            {user && (
              <div
                className="px-4 py-3 mb-2 rounded-lg"
                style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              >
                <div className="text-base font-medium">{user.name}</div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {getRoleLabel(user.role)}
                </div>
              </div>
            )}

            {/* Mobile Logout Button */}
            {user && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full px-4 py-3 rounded-lg font-medium transition-colors duration-200 touch-target"
                style={{
                  backgroundColor: '#ef4444',
                  color: 'white'
                }}
              >
                {auth.logout}
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
