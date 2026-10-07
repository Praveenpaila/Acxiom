import React from 'react';
import { Modal } from 'react-bootstrap';
import { formatDate, formatDateTime, getRoleBadgeClass } from '../../utils/formatters';
import { Building2, Mail, Phone, MapPin, User, Calendar, ShieldCheck } from 'lucide-react';

const CustomerDetailModal = ({ show, onHide, customer }) => {
  if (!customer) return null;

  return (
    <Modal show={show} onHide={onHide} centered dialogClassName="crm-modal">
      <div className="crm-card border-0 p-4" style={{ background: '#111827' }}>
        <div className="d-flex align-items-center justify-content-between mb-3 border-bottom border-secondary border-opacity-25 pb-3">
          <div className="d-flex align-items-center gap-2">
            <div className="brand-icon-box" style={{ width: '38px', height: '38px' }}>
              <Building2 size={20} />
            </div>
            <div>
              <h5 className="m-0 text-white fw-bold">{customer.company}</h5>
              <div className="text-muted small">
                Code: <span className="text-primary fw-semibold">{customer.customerCode}</span>
              </div>
            </div>
          </div>
          <button type="button" className="btn-close btn-close-white" onClick={onHide} aria-label="Close" />
        </div>

        <div className="row g-3 mb-4">
          <div className="col-12 col-md-6">
            <div className="p-3 rounded bg-dark border border-secondary border-opacity-10">
              <div className="text-muted small fw-semibold mb-1">CONTACT PERSON</div>
              <div className="fw-semibold text-white d-flex align-items-center gap-2">
                <User size={15} className="text-primary" /> {customer.name}
              </div>
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="p-3 rounded bg-dark border border-secondary border-opacity-10">
              <div className="text-muted small fw-semibold mb-1">ACCOUNT STATUS</div>
              <span className={`badge ${customer.status === 'Active' ? 'bg-success bg-opacity-25 text-success' : 'bg-secondary bg-opacity-25 text-secondary'}`}>
                {customer.status}
              </span>
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="p-3 rounded bg-dark border border-secondary border-opacity-10">
              <div className="text-muted small fw-semibold mb-1">CORPORATE EMAIL</div>
              <div className="text-white d-flex align-items-center gap-2 small">
                <Mail size={14} className="text-info" /> {customer.email}
              </div>
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="p-3 rounded bg-dark border border-secondary border-opacity-10">
              <div className="text-muted small fw-semibold mb-1">MOBILE PHONE</div>
              <div className="text-white d-flex align-items-center gap-2 small">
                <Phone size={14} className="text-warning" /> +91 {customer.phone}
              </div>
            </div>
          </div>

          <div className="col-12">
            <div className="p-3 rounded bg-dark border border-secondary border-opacity-10">
              <div className="text-muted small fw-semibold mb-1">LOCATION & ADDRESS</div>
              <div className="text-white d-flex align-items-center gap-2 small mb-1">
                <MapPin size={14} className="text-danger" />
                {customer.address ? customer.address : 'No street address recorded'}
              </div>
              <div className="text-secondary small">
                {[customer.city, customer.state].filter(Boolean).join(', ') || 'India'}
              </div>
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="p-3 rounded bg-dark border border-secondary border-opacity-10">
              <div className="text-muted small fw-semibold mb-1">ACCOUNT CREATOR</div>
              <div className="small text-white">
                {customer.createdBy?.name || 'System Admin'}
              </div>
              {customer.createdBy?.role && (
                <span className={`${getRoleBadgeClass(customer.createdBy.role)} mt-1 d-inline-block`} style={{ fontSize: '0.7rem' }}>
                  {customer.createdBy.role}
                </span>
              )}
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="p-3 rounded bg-dark border border-secondary border-opacity-10">
              <div className="text-muted small fw-semibold mb-1">REGISTRATION DATE</div>
              <div className="small text-white d-flex align-items-center gap-1">
                <Calendar size={13} className="text-muted" /> {formatDate(customer.createdAt)}
              </div>
              <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                Updated: {formatDateTime(customer.updatedAt)}
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-end">
          <button type="button" className="btn btn-crm-secondary" onClick={onHide}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CustomerDetailModal;
