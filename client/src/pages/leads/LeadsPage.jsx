import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import { UserCheck, Plus, Search, Filter } from 'lucide-react';

const LeadsPage = () => {
  return (
    <div>
      <PageHeader
        title="Leads"
        subtitle="Track inbound prospects, qualification lifecycle, and conversions."
      >
        <button className="btn btn-crm-primary d-flex align-items-center gap-2">
          <Plus size={16} /> Add Lead
        </button>
      </PageHeader>

      <div className="crm-card">
        <div className="row g-2 mb-3">
          <div className="col-12 col-md-6">
            <div className="input-group">
              <span className="input-group-text bg-dark border-secondary border-opacity-25 text-muted">
                <Search size={16} />
              </span>
              <input
                type="text"
                className="form-control crm-input"
                placeholder="Search leads by name, email, company..."
                disabled
              />
            </div>
          </div>
          <div className="col-12 col-md-6 d-flex justify-content-md-end gap-2">
            <button className="btn btn-crm-secondary d-flex align-items-center gap-2" disabled>
              <Filter size={15} /> Status Filter
            </button>
          </div>
        </div>

        <div className="text-center py-5">
          <div className="brand-icon-box mx-auto mb-3" style={{ background: 'rgba(14, 165, 233, 0.1)', color: '#38bdf8' }}>
            <UserCheck size={24} />
          </div>
          <h5 className="text-white mb-1">Lead Management Shell Ready</h5>
          <p className="text-muted small mx-auto" style={{ maxWidth: '400px' }}>
            Workflow transitions (New &rarr; Contacted &rarr; Qualified &rarr; Converted), validation, and customer conversion will be linked in Phase 4.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LeadsPage;
