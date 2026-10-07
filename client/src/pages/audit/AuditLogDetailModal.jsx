import React from 'react';
import { Modal } from 'react-bootstrap';
import { Shield, Clock, Globe, User, Server } from 'lucide-react';

const AuditLogDetailModal = ({ show, onHide, log }) => {
  if (!log) return null;

  return (
    <Modal show={show} onHide={onHide} centered size="lg" className="crm-modal">
      <div className="modal-content" style={{ background: '#0b1120', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
        <Modal.Header closeButton closeVariant="white" className="border-bottom border-dark px-4 py-3">
          <Modal.Title className="h6 text-white mb-0 d-flex align-items-center gap-2">
            <Shield size={18} className="text-info" />
            Audit Entry #{log._id.slice(-8).toUpperCase()}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="px-4 py-3">
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <div className="p-3 rounded bg-dark border border-secondary border-opacity-25">
                <div className="text-muted small d-flex align-items-center gap-2 mb-1">
                  <Clock size={14} /> Timestamp
                </div>
                <div className="text-white small fw-medium">
                  {new Date(log.createdAt).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="p-3 rounded bg-dark border border-secondary border-opacity-25">
                <div className="text-muted small d-flex align-items-center gap-2 mb-1">
                  <User size={14} /> Actor
                </div>
                <div className="text-white small fw-medium">
                  {log.userId?.name || log.userEmail || 'System / Unauthenticated'}
                  {log.userId?.role && ` (${log.userId.role})`}
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="p-3 rounded bg-dark border border-secondary border-opacity-25">
                <div className="text-muted small d-flex align-items-center gap-2 mb-1">
                  <Server size={14} /> Entity & Action
                </div>
                <div className="text-white small fw-medium">
                  <span className="badge bg-secondary me-2">{log.entityName}</span>
                  <span className="badge bg-primary">{log.action}</span>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="p-3 rounded bg-dark border border-secondary border-opacity-25">
                <div className="text-muted small d-flex align-items-center gap-2 mb-1">
                  <Globe size={14} /> IP & Network
                </div>
                <div className="text-white small fw-medium text-truncate" title={log.ipAddress || 'Internal'}>
                  {log.ipAddress || '127.0.0.1'}
                </div>
              </div>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-md-6">
              <h6 className="text-muted small text-uppercase">Previous State (oldValue)</h6>
              <div className="p-3 rounded bg-dark border border-secondary border-opacity-25" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {log.oldValue ? (
                  <pre className="text-warning small mb-0" style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                    {JSON.stringify(log.oldValue, null, 2)}
                  </pre>
                ) : (
                  <span className="text-muted small fst-italic">None / New record</span>
                )}
              </div>
            </div>

            <div className="col-md-6">
              <h6 className="text-muted small text-uppercase">New State (newValue)</h6>
              <div className="p-3 rounded bg-dark border border-secondary border-opacity-25" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {log.newValue ? (
                  <pre className="text-success small mb-0" style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                    {JSON.stringify(log.newValue, null, 2)}
                  </pre>
                ) : (
                  <span className="text-muted small fst-italic">None / Deleted</span>
                )}
              </div>
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer className="border-top border-dark px-4 py-3">
          <button type="button" className="btn btn-crm-secondary" onClick={onHide}>
            Close
          </button>
        </Modal.Footer>
      </div>
    </Modal>
  );
};

export default AuditLogDetailModal;
