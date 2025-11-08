import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '../contexts/SidebarContext';
import ThemeToggle from './ThemeToggle';
import SettingsButton from './settings/SettingsButton';
import { appName, nav, auth, users, orders } from '../utils/translations';

/**
 * Sidebar navigation component with role-based navigation
 * Responsive: Shows as fixed left sidebar on desktop, hamburger menu on mobile
 */
export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { isCollapsed, setIsCollapsed } = useSidebar();

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Fullscreen handlers
  const enterFullscreen = useCallback(() => {
    const elem = document.documentElement;
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
    <>
      {/* Mobile Top Bar */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14"
        style={{
          backgroundColor: 'var(--bg-primary)',
          boxShadow: '0 2px 4px var(--shadow)',
        }}
      >
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-xl">🍟</span>
          <span className="text-lg font-bold text-primary-600">{appName}</span>
        </Link>

        <div className="flex items-center space-x-2">
          <ThemeToggle />
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
          className="md:hidden fixed top-14 left-0 right-0 z-40 py-4 px-4 border-t"
          style={{
            backgroundColor: 'var(--bg-primary)',
            borderColor: 'var(--border-color)',
            maxHeight: 'calc(100vh - 56px)',
            overflowY: 'auto',
          }}
        >
          <div className="space-y-2 mb-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  flex items-center px-4 py-3 rounded-lg font-medium transition-colors duration-200 touch-target
                  ${isActive(link.path) ? 'bg-primary-600 text-white' : ''}
                `}
                style={
                  !isActive(link.path)
                    ? {
                        color: 'var(--text-primary)',
                        backgroundColor: 'var(--bg-secondary)',
                      }
                    : {}
                }
              >
                <span className="text-2xl mr-3">{link.icon}</span>
                <span className="text-base">{link.label}</span>
              </Link>
            ))}
          </div>

          {/* Settings Button for Manager and Cashier */}
          {(user?.role === 'manager' || user?.role === 'cashier') && (
            <div className="mb-4">
              <SettingsButton className="w-full" />
            </div>
          )}

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

          {user && (
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleLogout();
              }}
              className="w-full px-4 py-3 rounded-lg font-medium transition-colors duration-200 touch-target"
              style={{
                backgroundColor: '#ef4444',
                color: 'white',
              }}
            >
              {auth.logout}
            </button>
          )}
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex fixed left-0 top-0 h-screen flex-col transition-all duration-300"
        style={{
          backgroundColor: 'var(--bg-primary)',
          boxShadow: '2px 0 4px var(--shadow)',
          zIndex: 40,
          width: isCollapsed ? '80px' : '256px',
        }}
      >
        {/* Sidebar Header */}
        <div
          className="flex items-center justify-between px-4 py-4 border-b"
          style={{ borderColor: 'var(--border-color)' }}
        >
          {!isCollapsed && (
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl">🍟</span>
              <span className="text-xl font-bold text-primary-600">{appName}</span>
            </Link>
          )}
          {isCollapsed && (
            <Link to="/" className="flex items-center justify-center w-full">
              <span className="text-2xl">🍟</span>
            </Link>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg transition-colors duration-200 ml-auto"
            style={{ color: 'var(--text-primary)' }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--hover-bg)')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span className="text-lg">{isCollapsed ? '»' : '«'}</span>
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="space-y-1 px-3">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`
                  flex items-center px-4 py-3 rounded-lg font-medium transition-colors duration-200
                  ${
                    isActive(link.path)
                      ? 'bg-primary-600 text-white'
                      : ''
                  }
                `}
                style={
                  !isActive(link.path)
                    ? {
                        color: 'var(--text-primary)',
                      }
                    : {}
                }
                onMouseOver={(e) => {
                  if (!isActive(link.path)) {
                    e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isActive(link.path)) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
                title={isCollapsed ? link.label : ''}
              >
                <span className="text-2xl mr-3">{link.icon}</span>
                {!isCollapsed && <span className="text-base">{link.label}</span>}
              </Link>
            ))}
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t px-3 py-4" style={{ borderColor: 'var(--border-color)' }}>
          {/* Settings Button for Manager and Cashier */}
          {!isCollapsed && (user?.role === 'manager' || user?.role === 'cashier') && (
            <div className="mb-4">
              <SettingsButton className="w-full justify-center" />
            </div>
          )}

          {/* Theme Toggle and Fullscreen in Sidebar Footer */}
          {!isCollapsed && (
            <div className="flex items-center justify-center space-x-2 mb-4">
              <ThemeToggle />
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-lg transition-colors duration-200"
                style={{ color: 'var(--text-primary)' }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--hover-bg)')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                title={isFullscreen ? 'Quitter plein écran' : 'Plein écran'}
              >
                <span className="text-xl">{isFullscreen ? '⊗' : '⛶'}</span>
              </button>
            </div>
          )}

          {isCollapsed && (
            <>
              <div className="flex justify-center mb-2">
                <ThemeToggle />
              </div>
              <div className="flex justify-center mb-4">
                <button
                  onClick={toggleFullscreen}
                  className="p-2 rounded-lg transition-colors duration-200"
                  style={{ color: 'var(--text-primary)' }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--hover-bg)')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  title={isFullscreen ? 'Quitter plein écran' : 'Plein écran'}
                >
                  <span className="text-xl">{isFullscreen ? '⊗' : '⛶'}</span>
                </button>
              </div>
            </>
          )}

          {/* User Info */}
          {user && !isCollapsed && (
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

          {/* User Avatar when collapsed */}
          {user && isCollapsed && (
            <div className="flex justify-center mb-2">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
                style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                title={user.name}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>
          )}

          {/* Logout Button */}
          {user && (
            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 rounded-lg font-medium transition-colors duration-200"
              style={{
                backgroundColor: '#ef4444',
                color: 'white',
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = '#dc2626')}
              onMouseOut={(e) => (e.target.style.backgroundColor = '#ef4444')}
              title={isCollapsed ? auth.logout : ''}
            >
              {!isCollapsed ? auth.logout : '🚪'}
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
