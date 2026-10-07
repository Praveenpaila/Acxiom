import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import { TrendingUp, Plus, Search, Filter } from 'lucide-react';

const OpportunitiesPage = () => {
  return (
    <div>
      <PageHeader
        title="Opportunities"
        subtitle="Manage deal stages, win probabilities, and weighted pipeline revenue."
      >
        <button className="btn btn-crm-primary d-flex align-items-center gap-2">
          <Plus size={16} /> New Opportunity
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
                placeholder="Search deals by name or customer..."
                disabled
              />
            </div>
          </div>
          <div className="col-12 col-md-6 d-flex justify-content-md-end gap-2">
            <button className="btn btn-crm-secondary d-flex align-items-center gap-2" disabled>
              <Filter size={15} /> Stage Filter
            </button>
          </div>
        </div>

        <div className="text-center py-5">
          <div className="brand-icon-box mx-auto mb-3" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#34d399' }}>
            <TrendingUp size={24} />
          </div>
          <h5 className="text-white mb-1">Deal Pipeline Shell Ready</h5>
          <p className="text-muted small mx-auto" style={{ maxWidth: '400px' }}>
            Full opportunity pipeline tracking, stage progression, and weighted forecast calculations will be linked in Phase 6.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OpportunitiesPage;
