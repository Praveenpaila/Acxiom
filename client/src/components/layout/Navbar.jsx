import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Shield, Sparkles } from 'lucide-react';
import { getRoleBadgeClass } from '../../utils/formatters';

const Navbar = () => {
  const { user } = useAuth();

  return (
    <header className="app-header">
      <div className="d-flex align-items-center gap-2">
        <div className="badge bg-secondary bg-opacity-25 text-light d-flex align-items-center gap-1 px-2 py-1">
          <Sparkles size={13} className="text-warning" />
          <span style={{ fontSize: '0.75rem' }}>Enterprise Edition</span>
        </div>
        <span className="text-muted d-none d-md-inline" style={{ fontSize: '0.8rem' }}>
          • India CRM Operations
        </span>
      </div>

      <div className="d-flex align-items-center gap-3">
        <div className="d-flex align-items-center gap-2">
          <Shield size={16} className="text-primary" />
          <span className="text-secondary small d-none d-sm-inline">Role:</span>
          <span className={getRoleBadgeClass(user?.role)}>{user?.role}</span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
