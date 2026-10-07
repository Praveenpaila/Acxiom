import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  TrendingUp,
  CalendarCheck,
  BarChart3,
  ShieldAlert,
  ShieldCheck,
  LogOut,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getRoleBadgeClass } from '../../utils/formatters';

const Sidebar = () => {
  const { user, logout, isAdmin } = useAuth();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/customers', label: 'Customers', icon: Building2 },
    { to: '/leads', label: 'Leads', icon: UserCheck },
    { to: '/opportunities', label: 'Opportunities', icon: TrendingUp },
    { to: '/follow-ups', label: 'Follow-Ups', icon: CalendarCheck },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
  ];

  const adminNavItems = [
    { to: '/users', label: 'User & Roles', icon: Users },
    { to: '/audit-log', label: 'Audit Log', icon: ShieldAlert },
  ];

  return (
    <aside className="app-sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <NavLink to="/dashboard" className="brand-badge">
          <div className="brand-icon-box">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h1 className="brand-title">Acxiom<span>CRM</span></h1>
          </div>
        </NavLink>
      </div>

      {/* Navigation Items */}
      <div className="sidebar-nav">
        <div className="nav-section-title">Core Operations</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        {/* Admin Only Section */}
        {isAdmin && (
          <>
            <div className="nav-section-title">Administration</div>
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </>
        )}
      </div>

      {/* User Session Footer */}
      <div className="sidebar-footer">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div className="overflow-hidden me-2">
            <div className="fw-semibold text-truncate text-white small">{user?.name}</div>
            <div className="text-muted text-truncate" style={{ fontSize: '0.72rem' }}>
              {user?.email}
            </div>
          </div>
          <button
            onClick={logout}
            className="btn btn-sm btn-outline-danger p-1 d-flex align-items-center justify-content-center"
            title="Log Out"
            style={{ width: '32px', height: '32px', borderRadius: '8px' }}
          >
            <LogOut size={15} />
          </button>
        </div>
        <div className="d-flex align-items-center justify-content-between">
          <span className={getRoleBadgeClass(user?.role)}>{user?.role}</span>
          <span className="badge bg-success bg-opacity-25 text-success small" style={{ fontSize: '0.7rem' }}>
            Active
          </span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
