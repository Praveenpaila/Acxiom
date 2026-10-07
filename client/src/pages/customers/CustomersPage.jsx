import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import { Building2, Plus, Search, Filter } from 'lucide-react';

const CustomersPage = () => {
  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Manage client accounts, unique identifiers, and contact details."
      >
        <button className="btn btn-crm-primary d-flex align-items-center gap-2">
          <Plus size={16} /> Add Customer
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
                placeholder="Search customers by name, company, email or phone..."
                disabled
              />
            </div>
          </div>
          <div className="col-12 col-md-6 d-flex justify-content-md-end gap-2">
            <button className="btn btn-crm-secondary d-flex align-items-center gap-2" disabled>
              <Filter size={15} /> Filter
            </button>
          </div>
        </div>

        <div className="text-center py-5">
          <div className="brand-icon-box mx-auto mb-3" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8' }}>
            <Building2 size={24} />
          </div>
          <h5 className="text-white mb-1">Customer Module Shell Ready</h5>
          <p className="text-muted small mx-auto" style={{ maxWidth: '400px' }}>
            Full CRUD, unique code generation (CUST-XXXX), duplicate checking, and Indian phone validation will be linked in Phase 3.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomersPage;
