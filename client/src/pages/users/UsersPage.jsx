import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import { Users, UserPlus, Shield } from 'lucide-react';

const UsersPage = () => {
  return (
    <div>
      <PageHeader
        title="User & Role Management"
        subtitle="Admin control panel: provisioning users, role assignments, lockout state, and resets."
      >
        <button className="btn btn-crm-primary d-flex align-items-center gap-2">
          <UserPlus size={16} /> Create User
        </button>
      </PageHeader>

      <div className="crm-card">
        <div className="text-center py-5">
          <div className="brand-icon-box mx-auto mb-3" style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#fb7185' }}>
            <Users size={24} />
          </div>
          <h5 className="text-white mb-1">User & Role Administration Shell Ready</h5>
          <p className="text-muted small mx-auto" style={{ maxWidth: '420px' }}>
            Admin-only module to create accounts, toggle active/deactive status, inspect lockout timers, and assign roles.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
