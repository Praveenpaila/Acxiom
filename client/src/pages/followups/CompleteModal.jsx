import React, { useState } from 'react';
import { Modal } from 'react-bootstrap';
import { followUpApi } from '../../api/followUpApi';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const CompleteModal = ({ show, onHide, followUp, onCompleted }) => {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!followUp) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await followUpApi.completeFollowUp(followUp.id, { completedNotes: notes });
      onCompleted('Activity marked as completed.');
      setNotes('');
      onHide();
    } catch (err) {
      setError(err.customMessage || 'Failed to complete activity.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered dialogClassName="crm-modal">
      <div className="crm-card border-0 p-4" style={{ background: '#111827' }}>
        <div className="d-flex align-items-center justify-content-between mb-3 border-bottom border-secondary border-opacity-25 pb-3">
          <div className="d-flex align-items-center gap-2">
            <div className="brand-icon-box" style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #10b981, #059669)' }}>
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h5 className="m-0 text-white fw-bold">Complete Activity</h5>
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
            <label className="form-label small text-secondary fw-semibold">Outcome Notes / Meeting Summary</label>
            <textarea
              rows={4}
              required
              className="form-control crm-input"
              placeholder="Record summary of conversation, key decisions made, client feedback, or agreed action items..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="d-flex justify-content-end gap-2 pt-3 border-top border-secondary border-opacity-25">
            <button type="button" className="btn btn-crm-secondary" onClick={onHide} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-success" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Mark Completed'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default CompleteModal;
