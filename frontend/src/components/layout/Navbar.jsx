import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authStore } from '../../store/authStore';
import { authApi } from '../../api/auth.api';
import { useState } from 'react';
import {
  LayoutDashboard, Calendar, Building2, BookOpen, User,
  LogOut, Menu, X, Shield, ChevronDown
} from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = authStore.getUser();
  const isAdmin = authStore.isAdmin();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await authApi.logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  const userLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/book', label: 'Book Hall', icon: Calendar },
    { to: '/bookings', label: 'My Bookings', icon: BookOpen },
  ];

  const adminLinks = [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard },
    { to: '/admin/bookings', label: 'Bookings', icon: BookOpen },
    { to: '/admin/halls', label: 'Halls', icon: Building2 },
    { to: '/admin/users', label: 'Users', icon: User },
    { to: '/admin/feedback', label: 'Feedback', icon: BookOpen },
    { to: '/admin/reports', label: 'Reports', icon: Shield },
  ];

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <div style={{
          width: 32, height: 32, background: 'var(--color-primary)',
          borderRadius: 'var(--radius-md)', display: 'flex',
          alignItems: 'center', justifyContent: 'center'
        }}>
          <Building2 size={18} color="white" />
        </div>
        <span>Campus Halls</span>
      </Link>

      {/* Desktop nav */}
      <div className="navbar-nav" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
        {(isAdmin ? adminLinks : userLinks).map(link => (
          <Link
            key={link.to}
            to={link.to}
            className={`navbar-link ${location.pathname === link.to ? 'active' : ''}`}
          >
            <link.icon size={16} />
            {link.label}
          </Link>
        ))}

        {/* User menu */}
        <div style={{ position: 'relative', marginLeft: 'var(--space-2)' }}>
          <div
            className="navbar-user"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '6px 12px' }}
          >
            <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{getInitials(user?.full_name)}</div>
            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.full_name?.split(' ')[0]}
            </span>
            <ChevronDown size={14} />
          </div>

          {userMenuOpen && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: 4,
              background: 'var(--color-white)', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)',
              minWidth: 200, zIndex: 200, overflow: 'hidden'
            }}>
              <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{user?.full_name}</div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{user?.email}</div>
              </div>
              <Link
                to="/profile"
                className="navbar-link"
                style={{ width: '100%', borderRadius: 0, padding: '10px 16px' }}
                onClick={() => setUserMenuOpen(false)}
              >
                <User size={14} /> Profile
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="navbar-link"
                  style={{ width: '100%', borderRadius: 0, padding: '10px 16px' }}
                  onClick={() => setUserMenuOpen(false)}
                >
                  <Shield size={14} /> Admin Panel
                </Link>
              )}
              <div
                className="navbar-link"
                style={{ width: '100%', borderRadius: 0, padding: '10px 16px', cursor: 'pointer', color: 'var(--color-error)' }}
                onClick={() => { setUserMenuOpen(false); handleLogout(); }}
              >
                <LogOut size={14} /> Logout
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
