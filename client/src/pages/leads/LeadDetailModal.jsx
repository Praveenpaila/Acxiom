import React from 'react';
import { Modal } from 'react-bootstrap';
import { formatDate, formatCurrency, getRoleBadgeClass } from '../../utils/formatters';
import {
  UserCheck,
  Mail,
  Phone,
  Building2,
  Tag,
  IndianRupee,
  FileText,
  Calendar,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

const LeadDetailModal = ({
  show,
  onHide,
  lead,
  onStatusChange,
  onOpenConvert,
}) => {
  if (!lead) return null;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'New':
        return 'bg-primary bg-opacity-25 text-primary';
      case 'Contacted':
        return 'bg-info bg-opacity-25 text-info';
      case 'Qualified':
        return 'bg-success bg-opacity-25 text-success';
      case 'Converted':
        return 'bg-purple bg-opacity-25 text-purple';
      case 'Unqualified':
        return 'bg-secondary bg-opacity-25 text-secondary';
      case 'Lost':
        return 'bg-danger bg-opacity-25 text-danger';
      default:
        return 'bg-secondary';
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered dialogClassName="crm-modal">
      <div className="crm-card border-0 p-4" style={{ background: '#111827' }}>
        <div className="d-flex align-items-center justify-content-between mb-3 border-bottom border-secondary border-opacity-25 pb-3">
          <div className="d-flex align-items-center gap-2">
            <div className="brand-icon-box" style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg, #0ea5e9, #0284c7)' }}>
              <UserCheck size={20} />
            </div>
            <div>
              <h5 className="m-0 text-white fw-bold">{lead.company}</h5>
              <div className="text-muted small">
                Code: <span className="text-info fw-semibold">{lead.leadCode}</span>
              </div>
            </div>
          </div>
          <button type="button" className="btn-close btn-close-white" onClick={onHide} aria-label="Close" />
        </div>

        {/* Lead Status Header */}
        <div className="d-flex align-items-center justify-content-between p-3 rounded bg-dark border border-secondary border-opacity-15 mb-3">
          <div>
            <div className="text-muted small">Current Stage:</div>
            <span className={`badge ${getStatusBadge(lead.status)} fs-6 mt-1`}>
              {lead.status}
            </span>
          </div>

          <div className="text-end">
            <div className="text-muted small">Expected Deal Value:</div>
            <div className="fw-bold text-white fs-5">{formatCurrency(lead.expectedValue)}</div>
          </div>
        </div>

        {/* Quick Transition Actions */}
        {lead.status !== 'Converted' && (
          <div className="mb-4">
            <div className="text-muted small fw-semibold mb-2">WORKFLOW ACTIONS:</div>
            <div className="d-flex flex-wrap gap-2">
              {lead.status === 'New' && (
                <>
                  <button
                    className="btn btn-sm btn-outline-info"
                    onClick={() => onStatusChange(lead.id, 'Contacted')}
                  >
                    Mark Contacted
                  </button>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => onStatusChange(lead.id, 'Unqualified')}
                  >
                    Mark Unqualified
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => onStatusChange(lead.id, 'Lost')}
                  >
                    Mark Lost
                  </button>
                </>
              )}

              {lead.status === 'Contacted' && (
                <>
                  <button
                    className="btn btn-sm btn-outline-success"
                    onClick={() => onStatusChange(lead.id, 'Qualified')}
                  >
                    Qualify Lead
                  </button>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => onStatusChange(lead.id, 'Unqualified')}
                  >
                    Mark Unqualified
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => onStatusChange(lead.id, 'Lost')}
                  >
                    Mark Lost
                  </button>
                </>
              )}

              {lead.status === 'Qualified' && (
                <>
                  <button
                    className="btn btn-sm btn-success d-flex align-items-center gap-1"
                    onClick={() => onOpenConvert(lead)}
                  >
                    <Sparkles size={14} /> Convert to Customer + Deal
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => onStatusChange(lead.id, 'Lost')}
                  >
                    Mark Lost
                  </button>
                </>
              )}

              {(lead.status === 'Unqualified' || lead.status === 'Lost') && (
                <button
                  className="btn btn-sm btn-outline-info"
                  onClick={() => onStatusChange(lead.id, 'Contacted')}
                >
                  Re-engage & Mark Contacted
                </button>
              )}
            </div>
          </div>
        )}

        {/* Conversion Details (if already converted) */}
        {lead.status === 'Converted' && lead.convertedCustomerId && (
          <div className="p-3 mb-3 rounded bg-success bg-opacity-10 border border-success border-opacity-25">
            <div className="d-flex align-items-center gap-2 text-success fw-semibold small mb-1">
              <CheckCircle2 size={16} /> Lead Successfully Converted
            </div>
            <div className="small text-secondary">
              Customer: <strong className="text-white">{lead.convertedCustomerId.company}</strong> ({lead.convertedCustomerId.customerCode})
            </div>
          </div>
        )}

        <div className="row g-3 mb-4">
          <div className="col-12 col-md-6">
            <div className="p-3 rounded bg-dark border border-secondary border-opacity-10">
              <div className="text-muted small fw-semibold mb-1">PROSPECT CONTACT</div>
              <div className="fw-semibold text-white">{lead.name}</div>
              <div className="text-secondary small mt-1 d-flex align-items-center gap-1">
                <Mail size={13} /> {lead.email}
              </div>
              <div className="text-secondary small mt-1 d-flex align-items-center gap-1">
                <Phone size={13} /> +91 {lead.phone}
              </div>
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="p-3 rounded bg-dark border border-secondary border-opacity-10">
              <div className="text-muted small fw-semibold mb-1">SOURCE & ASSIGNMENT</div>
              <div className="text-white small d-flex align-items-center gap-1">
                <Tag size={13} className="text-primary" /> Source: {lead.source}
              </div>
              <div className="text-secondary small mt-2">
                Assigned to: <strong className="text-white">{lead.assignedTo?.name || 'Unassigned'}</strong>
                {lead.assignedTo?.role && (
                  <span className={`${getRoleBadgeClass(lead.assignedTo.role)} ms-1`} style={{ fontSize: '0.65rem' }}>
                    {lead.assignedTo.role}
                  </span>
                )}
              </div>
            </div>
          </div>

          {lead.notes && (
            <div className="col-12">
              <div className="p-3 rounded bg-dark border border-secondary border-opacity-10">
                <div className="text-muted small fw-semibold mb-1">NOTES</div>
                <div className="small text-secondary">{lead.notes}</div>
              </div>
            </div>
          )}
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

export default LeadDetailModal;
