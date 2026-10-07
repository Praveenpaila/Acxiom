import React, { useState } from 'react';
import { Modal } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { leadApi } from '../../api/leadApi';
import { formatCurrency } from '../../utils/formatters';
import { ArrowRight, AlertCircle, TrendingUp, Calendar, IndianRupee, Sparkles } from 'lucide-react';

const convertSchema = z.object({
  dealName: z.string().min(2, 'Deal name must be at least 2 characters.'),
  amount: z.number().min(1, 'Opportunity Amount must be greater than 0.'),
  expectedCloseDate: z.string().min(1, 'Expected close date is required.'),
});

const ConvertLeadModal = ({ show, onHide, lead, onConverted }) => {
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultCloseDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const todayStr = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(convertSchema),
    values: {
      dealName: lead ? `${lead.company} - Commercial Contract` : '',
      amount: lead?.expectedValue && lead.expectedValue > 0 ? lead.expectedValue : 150000,
      expectedCloseDate: defaultCloseDate,
    },
  });

  if (!lead) return null;

  const onSubmit = async (data) => {
    setServerError('');
    setIsSubmitting(true);
    try {
      const res = await leadApi.convertLead(lead.id, data);
      onConverted(res.message || 'Lead converted successfully.');
      onHide();
    } catch (err) {
      setServerError(err.customMessage || 'Failed to convert lead.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static" dialogClassName="crm-modal">
      <div className="crm-card border-0 p-4" style={{ background: '#111827' }}>
        <div className="d-flex align-items-center justify-content-between mb-3 border-bottom border-secondary border-opacity-25 pb-3">
          <div className="d-flex align-items-center gap-2">
            <div
              className="brand-icon-box"
              style={{
                width: '38px',
                height: '38px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <h5 className="m-0 text-white fw-bold">Convert Lead to Deal</h5>
              <div className="text-muted small">
                {lead.company} ({lead.name})
              </div>
            </div>
          </div>
          <button type="button" className="btn-close btn-close-white" onClick={onHide} aria-label="Close" />
        </div>

        <div className="p-3 mb-3 rounded bg-dark border border-secondary border-opacity-15 small text-secondary">
          Converting this qualified lead will automatically provision a new{' '}
          <strong className="text-white">Customer Account</strong> and launch an active{' '}
          <strong className="text-white">Opportunity</strong> in your sales pipeline.
        </div>

        {serverError && (
          <div className="alert alert-danger d-flex align-items-center gap-2 p-2 small mb-3 border-0 bg-danger bg-opacity-10 text-danger">
            <AlertCircle size={16} className="flex-shrink-0" />
            <div>{serverError}</div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-3">
            <label className="form-label small text-secondary fw-semibold">Opportunity Name *</label>
            <div className="input-group">
              <span className="input-group-text bg-dark border-secondary border-opacity-25 text-muted">
                <TrendingUp size={15} />
              </span>
              <input
                type="text"
                className={`form-control crm-input ${errors.dealName ? 'is-invalid' : ''}`}
                {...register('dealName')}
              />
            </div>
            {errors.dealName && <div className="text-danger small mt-1">{errors.dealName.message}</div>}
          </div>

          <div className="row g-3 mb-3">
            <div className="col-12 col-md-6">
              <label className="form-label small text-secondary fw-semibold">Opportunity Amount (₹) *</label>
              <div className="input-group">
                <span className="input-group-text bg-dark border-secondary border-opacity-25 text-muted">
                  <IndianRupee size={15} />
                </span>
                <input
                  type="number"
                  step="5000"
                  min="1"
                  className={`form-control crm-input ${errors.amount ? 'is-invalid' : ''}`}
                  {...register('amount', { valueAsNumber: true })}
                />
              </div>
              {errors.amount && <div className="text-danger small mt-1">{errors.amount.message}</div>}
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label small text-secondary fw-semibold">Expected Close Date *</label>
              <div className="input-group">
                <span className="input-group-text bg-dark border-secondary border-opacity-25 text-muted">
                  <Calendar size={15} />
                </span>
                <input
                  type="date"
                  min={todayStr}
                  className={`form-control crm-input ${errors.expectedCloseDate ? 'is-invalid' : ''}`}
                  {...register('expectedCloseDate')}
                />
              </div>
              {errors.expectedCloseDate && (
                <div className="text-danger small mt-1">{errors.expectedCloseDate.message}</div>
              )}
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 pt-3 border-top border-secondary border-opacity-25">
            <button type="button" className="btn btn-crm-secondary" onClick={onHide} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-success d-flex align-items-center gap-2"
              disabled={isSubmitting}
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none' }}
            >
              {isSubmitting ? 'Converting...' : (
                <>
                  <span>Convert to Customer & Deal</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default ConvertLeadModal;
