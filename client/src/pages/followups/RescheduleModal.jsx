import React, { useState } from 'react';
import { Modal } from 'react-bootstrap';
import { followUpApi } from '../../api/followUpApi';
import { Calendar, AlertCircle } from 'lucide-react';

const todayStr = new Date().toISOString().split('T')[0];

const RescheduleModal = ({ show, onHide, followUp, onRescheduled }) => {
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!followUp) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dueDate) {
      setError('Please select a new date.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await followUpApi.rescheduleFollowUp(followUp.id, { dueDate, notes });
      onRescheduled('Activity rescheduled successfully.');
      onHide();
    } catch (err) {
      setError(err.customMessage || 'Failed to reschedule.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered dialogClassName="crm-modal">
      <div className="crm-card border-0 p-4" style={{ background: '#111827' }}>
        <div className="d-flex align-items-center justify-content-between mb-3 border-bottom border-secondary border-opacity-25 pb-3">
          <div className="d-flex align-items-center gap-2">
            <div className="brand-icon-box" style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
              <Calendar size={18} />
            </div>
            <div>
              <h5 className="m-0 text-white fw-bold">Reschedule Activity</h5>
              <div className="text-muted small">{followUp.title}</div>
            </div>
          </div>
          <button type="button" className="btn-close btn-close-white" onClick={onHide} aria-label="Close" />
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-2 p-2 small mb-3 border-0 bg-danger bg-opacity-10 text-danger">
            <AlertCircle size={16} className="flex-shrink-0" />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label small text-secondary fw-semibold">New Scheduled Date *</label>
            <input
              type="date"
              min={todayStr}
              required
              className="form-control crm-input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label small text-secondary fw-semibold">Reschedule Reason</label>
            <textarea
              rows={2}
              className="form-control crm-input"
              placeholder="e.g. Client requested postponement due to internal reviews..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="d-flex justify-content-end gap-2 pt-3 border-top border-secondary border-opacity-25">
            <button type="button" className="btn btn-crm-secondary" onClick={onHide} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-warning" disabled={isSubmitting}>
              {isSubmitting ? 'Rescheduling...' : 'Confirm Reschedule'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default RescheduleModal;
