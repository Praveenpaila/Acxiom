import React, { useState } from 'react';
import { Modal } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { followUpApi } from '../../api/followUpApi';
import { CalendarCheck, AlertCircle, Phone, Users, Mail, CheckSquare } from 'lucide-react';

const todayStr = new Date().toISOString().split('T')[0];

const schema = z.object({
  type: z.enum(['Call', 'Meeting', 'Email', 'Task']),
  title: z.string().min(2, 'Title must be at least 2 characters.').max(150),
  dueDate: z.string().min(1, 'Date is required.'),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).default('Medium'),
  description: z.string().max(1000).optional().default(''),
});

const FollowUpModal = ({ show, onHide, onSaved }) => {
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'Call',
      title: '',
      dueDate: todayStr,
      priority: 'Medium',
      description: '',
    },
  });

  const onSubmit = async (data) => {
    setServerError('');
    setIsSubmitting(true);
    try {
      await followUpApi.createFollowUp(data);
      onSaved('Activity scheduled successfully.');
      reset();
      onHide();
    } catch (err) {
      setServerError(err.customMessage || 'Failed to schedule follow-up.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static" dialogClassName="crm-modal">
      <div className="crm-card border-0 p-4" style={{ background: '#111827' }}>
        <div className="d-flex align-items-center justify-content-between mb-3 border-bottom border-secondary border-opacity-25 pb-3">
          <div className="d-flex align-items-center gap-2">
            <div className="brand-icon-box" style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
              <CalendarCheck size={18} />
            </div>
            <div>
              <h5 className="m-0 text-white fw-bold">Schedule Activity / Follow-Up</h5>
              <div className="text-muted small">Call, Meeting, Email, or Task</div>
            </div>
          </div>
          <button type="button" className="btn-close btn-close-white" onClick={onHide} aria-label="Close" />
        </div>

        {serverError && (
          <div className="alert alert-danger d-flex align-items-center gap-2 p-2 small mb-3 border-0 bg-danger bg-opacity-10 text-danger">
            <AlertCircle size={16} className="flex-shrink-0" />
            <div>{serverError}</div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="row g-3 mb-3">
            <div className="col-12 col-md-6">
              <label className="form-label small text-secondary fw-semibold">Activity Type *</label>
              <select className="form-select crm-input" {...register('type')}>
                <option value="Call">📞 Call</option>
                <option value="Meeting">🤝 Meeting</option>
                <option value="Email">✉️ Email</option>
                <option value="Task">📋 Task</option>
              </select>
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label small text-secondary fw-semibold">Priority</label>
              <select className="form-select crm-input" {...register('priority')}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div className="col-12">
              <label className="form-label small text-secondary fw-semibold">Subject / Title *</label>
              <input
                type="text"
                className={`form-control crm-input ${errors.title ? 'is-invalid' : ''}`}
                placeholder="e.g. Call client to discuss commercial terms"
                {...register('title')}
              />
              {errors.title && <div className="text-danger small mt-1">{errors.title.message}</div>}
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label small text-secondary fw-semibold">Scheduled Date *</label>
              <input
                type="date"
                min={todayStr}
                className={`form-control crm-input ${errors.dueDate ? 'is-invalid' : ''}`}
                {...register('dueDate')}
              />
              {errors.dueDate && <div className="text-danger small mt-1">{errors.dueDate.message}</div>}
            </div>

            <div className="col-12">
              <label className="form-label small text-secondary fw-semibold">Details / Objectives</label>
              <textarea
                rows={3}
                className="form-control crm-input"
                placeholder="Key talking points, meeting agenda, or preparation notes..."
                {...register('description')}
              />
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 pt-3 border-top border-secondary border-opacity-25">
            <button type="button" className="btn btn-crm-secondary" onClick={onHide} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-crm-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Scheduling...' : 'Schedule Follow-Up'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default FollowUpModal;
