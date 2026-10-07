import React, { useEffect, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { leadApi } from '../../api/leadApi';
import { AlertCircle, UserCheck, Mail, Phone, Building2, IndianRupee, Tag, FileText } from 'lucide-react';

const indianPhoneRegex = /^[6-9]\d{9}$/;

const leadSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.').max(100),
  email: z.string().email('Enter a valid email address.'),
  phone: z.string().regex(indianPhoneRegex, 'Enter a valid phone number.'),
  company: z.string().min(2, 'Company name must be at least 2 characters.').max(100),
  source: z.enum(['Website', 'Referral', 'Cold Call', 'LinkedIn', 'Trade Show', 'Other']).default('Website'),
  expectedValue: z.number().min(0, 'Value cannot be negative.').default(0),
  notes: z.string().max(1000).optional().default(''),
});

const LeadModal = ({ show, onHide, lead = null, onSaved }) => {
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEdit = Boolean(lead?.id);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      company: '',
      source: 'Website',
      expectedValue: 0,
      notes: '',
    },
  });

  useEffect(() => {
    if (lead) {
      reset({
        name: lead.name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        company: lead.company || '',
        source: lead.source || 'Website',
        expectedValue: lead.expectedValue || 0,
        notes: lead.notes || '',
      });
    } else {
      reset({
        name: '',
        email: '',
        phone: '',
        company: '',
        source: 'Website',
        expectedValue: 0,
        notes: '',
      });
    }
    setServerError('');
  }, [lead, show, reset]);

  const onSubmit = async (data) => {
    setServerError('');
    setIsSubmitting(true);
    try {
      if (isEdit) {
        await leadApi.updateLead(lead.id, data);
      } else {
        await leadApi.createLead(data);
      }
      onSaved(isEdit ? 'Lead updated successfully.' : 'Lead created successfully.');
      onHide();
    } catch (err) {
      setServerError(err.customMessage || 'Failed to save lead.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static" dialogClassName="crm-modal">
      <div className="crm-card border-0 p-4" style={{ background: '#111827' }}>
        <div className="d-flex align-items-center justify-content-between mb-3 border-bottom border-secondary border-opacity-25 pb-3">
          <div className="d-flex align-items-center gap-2">
            <div className="brand-icon-box" style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #0ea5e9, #0284c7)' }}>
              <UserCheck size={18} />
            </div>
            <div>
              <h5 className="m-0 text-white fw-bold">
                {isEdit ? `Edit Lead (${lead?.leadCode})` : 'Create New Lead'}
              </h5>
              <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                Track new prospects and deal pipeline valuation
              </div>
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
              <label className="form-label small text-secondary fw-semibold">Prospect Name *</label>
              <div className="input-group">
                <span className="input-group-text bg-dark border-secondary border-opacity-25 text-muted">
                  <UserCheck size={15} />
                </span>
                <input
                  type="text"
                  className={`form-control crm-input ${errors.name ? 'is-invalid' : ''}`}
                  placeholder="e.g. Aditi Rao"
                  {...register('name')}
                />
              </div>
              {errors.name && <div className="text-danger small mt-1">{errors.name.message}</div>}
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label small text-secondary fw-semibold">Company Name *</label>
              <div className="input-group">
                <span className="input-group-text bg-dark border-secondary border-opacity-25 text-muted">
                  <Building2 size={15} />
                </span>
                <input
                  type="text"
                  className={`form-control crm-input ${errors.company ? 'is-invalid' : ''}`}
                  placeholder="e.g. Zomato Media"
                  {...register('company')}
                />
              </div>
              {errors.company && <div className="text-danger small mt-1">{errors.company.message}</div>}
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label small text-secondary fw-semibold">Email Address *</label>
              <div className="input-group">
                <span className="input-group-text bg-dark border-secondary border-opacity-25 text-muted">
                  <Mail size={15} />
                </span>
                <input
                  type="email"
                  className={`form-control crm-input ${errors.email ? 'is-invalid' : ''}`}
                  placeholder="aditi@zomato-demo.in"
                  {...register('email')}
                />
              </div>
              {errors.email && <div className="text-danger small mt-1">{errors.email.message}</div>}
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label small text-secondary fw-semibold">Phone (10 digits) *</label>
              <div className="input-group">
                <span className="input-group-text bg-dark border-secondary border-opacity-25 text-muted">
                  <Phone size={15} />
                </span>
                <input
                  type="tel"
                  className={`form-control crm-input ${errors.phone ? 'is-invalid' : ''}`}
                  placeholder="9811002233"
                  maxLength={10}
                  {...register('phone')}
                />
              </div>
              {errors.phone && <div className="text-danger small mt-1">{errors.phone.message}</div>}
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label small text-secondary fw-semibold">Lead Source</label>
              <div className="input-group">
                <span className="input-group-text bg-dark border-secondary border-opacity-25 text-muted">
                  <Tag size={15} />
                </span>
                <select className="form-select crm-input" {...register('source')}>
                  <option value="Website">Website</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Referral">Referral</option>
                  <option value="Cold Call">Cold Call</option>
                  <option value="Trade Show">Trade Show</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label small text-secondary fw-semibold">Expected Value (₹)</label>
              <div className="input-group">
                <span className="input-group-text bg-dark border-secondary border-opacity-25 text-muted">
                  <IndianRupee size={15} />
                </span>
                <input
                  type="number"
                  step="5000"
                  min="0"
                  className={`form-control crm-input ${errors.expectedValue ? 'is-invalid' : ''}`}
                  placeholder="500000"
                  {...register('expectedValue', { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="col-12">
              <label className="form-label small text-secondary fw-semibold">Notes / Requirements</label>
              <div className="input-group">
                <span className="input-group-text bg-dark border-secondary border-opacity-25 text-muted">
                  <FileText size={15} />
                </span>
                <textarea
                  rows={3}
                  className="form-control crm-input"
                  placeholder="Specific requirements, discussion summary, budget hints..."
                  {...register('notes')}
                />
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 pt-3 border-top border-secondary border-opacity-25">
            <button type="button" className="btn btn-crm-secondary" onClick={onHide} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-crm-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEdit ? 'Update Lead' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default LeadModal;
