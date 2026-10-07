import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import { ShieldAlert, Filter } from 'lucide-react';

const AuditLogPage = () => {
  return (
    <div>
      <PageHeader
        title="Security & Audit Trail"
        subtitle="Append-only immutable record of logins, failed attempts, lockouts, and entity mutations."
      >
        <button className="btn btn-crm-secondary d-flex align-items-center gap-2" disabled>
          <Filter size={15} /> Filter Logs
        </button>
      </PageHeader>

      <div className="crm-card">
        <div className="text-center py-5">
          <div className="brand-icon-box mx-auto mb-3" style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#fb7185' }}>
            <ShieldAlert size={24} />
          </div>
          <h5 className="text-white mb-1">Audit Trail Shell Ready</h5>
          <p className="text-muted small mx-auto" style={{ maxWidth: '420px' }}>
            Centralized compliance audit logger tracking user actions, IP addresses, and state changes (Phase 8).
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuditLogPage;
