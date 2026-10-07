import React, { useEffect, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { opportunityApi } from '../../api/opportunityApi';
import { customerApi } from '../../api/customerApi';
import { formatCurrency } from '../../utils/formatters';
import {
  TrendingUp,
  Building2,
  Calendar,
  IndianRupee,
  Percent,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

const todayStr = new Date().toISOString().split('T')[0];

const oppSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.').max(150),
  customerId: z.string().min(1, 'Please select a customer account.'),
  amount: z.number().min(1, 'Opportunity Amount must be greater than 0.'),
  stage: z.enum(['Qualification', 'Proposal', 'Negotiation', 'Won', 'Lost']),
  probability: z.number().min(0).max(100),
  expectedCloseDate: z.string().min(1, 'Close date is required.'),
  notes: z.string().max(1000).optional().default(''),
});

const DEFAULT_PROBABILITIES = {
  Qualification: 25,
  Proposal: 50,
  Negotiation: 80,
  Won: 100,
  Lost: 0,
};

const OpportunityModal = ({ show, onHide, opportunity = null, onSaved }) => {
  const [customers, setCustomers] = useState([]);
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEdit = Boolean(opportunity?.id);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(oppSchema),
    defaultValues: {
      name: '',
      customerId: '',
      amount: 250000,
      stage: 'Qualification',
      probability: 25,
      expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: '',
    },
  });

  const watchedAmount = useWatch({ control, name: 'amount' }) || 0;
  const watchedProb = useWatch({ control, name: 'probability' }) || 0;
  const weightedCalc = Math.round((Number(watchedAmount) * Number(watchedProb)) / 100);

  useEffect(() => {
    if (show) {
      customerApi.getCustomers({ limit: 100 }).then((res) => {
        if (res.success) setCustomers(res.customers);
      });

      if (opportunity) {
        reset({
          name: opportunity.name || '',
          customerId: opportunity.customerId?.id || opportunity.customerId || '',
          amount: opportunity.amount || 250000,
          stage: opportunity.stage || 'Qualification',
          probability: opportunity.probability !== undefined ? opportunity.probability : 25,
          expectedCloseDate: opportunity.expectedCloseDate
            ? new Date(opportunity.expectedCloseDate).toISOString().split('T')[0]
            : todayStr,
          notes: opportunity.notes || '',
        });
      } else {
        reset({
          name: '',
          customerId: '',
          amount: 250000,
          stage: 'Qualification',
          probability: 25,
          expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          notes: '',
        });
      }
      setServerError('');
    }
  }, [show, opportunity, reset]);

  const handleStageChange = (e) => {
    const stage = e.target.value;
    setValue('stage', stage);
    if (DEFAULT_PROBABILITIES[stage] !== undefined) {
      setValue('probability', DEFAULT_PROBABILITIES[stage]);
    }
  };

  const onSubmit = async (data) => {
    setServerError('');
    setIsSubmitting(true);
    try {
      if (isEdit) {
        await opportunityApi.updateOpportunity(opportunity.id, data);
      } else {
        await opportunityApi.createOpportunity(data);
      }
      onSaved(isEdit ? 'Opportunity updated successfully.' : 'Opportunity created successfully.');
      onHide();
    } catch (err) {
      setServerError(err.customMessage || 'Failed to save opportunity.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static" dialogClassName="crm-modal">
      <div className="crm-card border-0 p-4" style={{ background: '#111827' }}>
        <div className="d-flex align-items-center justify-content-between mb-3 border-bottom border-secondary border-opacity-25 pb-3">
          <div className="d-flex align-items-center gap-2">
            <div className="brand-icon-box" style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #4f46e5, #6366f1)' }}>
              <TrendingUp size={18} />
            </div>
            <div>
              <h5 className="m-0 text-white fw-bold">
                {isEdit ? 'Edit Opportunity' : 'New Sales Opportunity'}
              </h5>
              <div className="text-muted small">Pipeline deal management & weighted forecast</div>
            </div>
          </div>
          <button type="button" className="btn-close btn-close-white" onClick={onHide} aria-label="Close" />
        </div>

        {/* Live Weighted Preview */}
        <div className="d-flex align-items-center justify-content-between p-3 rounded bg-dark border border-secondary border-opacity-15 mb-3">
          <div>
            <div className="text-muted small">Total Deal Amount:</div>
            <div className="fw-bold text-white fs-5">{formatCurrency(watchedAmount)}</div>
          </div>
          <div className="text-end">
            <div className="text-muted small">Weighted Pipeline Value:</div>
            <div className="fw-bold text-success fs-5">{formatCurrency(weightedCalc)}</div>
          </div>
        </div>

        {serverError && (
          <div className="alert alert-danger d-flex align-items-center gap-2 p-2 small mb-3 border-0 bg-danger bg-opacity-10 text-danger">
            <AlertCircle size={16} className="flex-shrink-0" />
            <div>{serverError}</div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="row g-3 mb-3">
            <div className="col-12">
              <label className="form-label small text-secondary fw-semibold">Opportunity Name *</label>
              <div className="input-group">
                <span className="input-group-text bg-dark border-secondary border-opacity-25 text-muted">
                  <TrendingUp size={15} />
                </span>
                <input
                  type="text"
                  className={`form-control crm-input ${errors.name ? 'is-invalid' : ''}`}
                  placeholder="e.g. Tata Consultancy Services - Cloud Modernization"
                  {...register('name')}
                />
              </div>
              {errors.name && <div className="text-danger small mt-1">{errors.name.message}</div>}
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label small text-secondary fw-semibold">Customer Account *</label>
              <div className="input-group">
                <span className="input-group-text bg-dark border-secondary border-opacity-25 text-muted">
                  <Building2 size={15} />
                </span>
                <select
                  className={`form-select crm-input ${errors.customerId ? 'is-invalid' : ''}`}
                  {...register('customerId')}
                >
                  <option value="">Select a customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company} ({c.customerCode})
                    </option>
                  ))}
                </select>
              </div>
              {errors.customerId && <div className="text-danger small mt-1">{errors.customerId.message}</div>}
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label small text-secondary fw-semibold">Deal Amount (₹) *</label>
              <div className="input-group">
                <span className="input-group-text bg-dark border-secondary border-opacity-25 text-muted">
                  <IndianRupee size={15} />
                </span>
                <input
                  type="number"
                  step="10000"
                  min="1"
                  className={`form-control crm-input ${errors.amount ? 'is-invalid' : ''}`}
                  {...register('amount', { valueAsNumber: true })}
                />
              </div>
              {errors.amount && <div className="text-danger small mt-1">{errors.amount.message}</div>}
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label small text-secondary fw-semibold">Sales Stage *</label>
              <select className="form-select crm-input" onChange={handleStageChange} {...register('stage')}>
                <option value="Qualification">Qualification</option>
                <option value="Proposal">Proposal</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Won">Won</option>
                <option value="Lost">Lost</option>
              </select>
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label small text-secondary fw-semibold">Probability (%) *</label>
              <div className="input-group">
                <span className="input-group-text bg-dark border-secondary border-opacity-25 text-muted">
                  <Percent size={15} />
                </span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className={`form-control crm-input ${errors.probability ? 'is-invalid' : ''}`}
                  {...register('probability', { valueAsNumber: true })}
                />
              </div>
              {errors.probability && <div className="text-danger small mt-1">{errors.probability.message}</div>}
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label small text-secondary fw-semibold">Expected Close *</label>
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

            <div className="col-12">
              <label className="form-label small text-secondary fw-semibold">Deal Notes</label>
              <textarea
                rows={3}
                className="form-control crm-input"
                placeholder="Key stakeholders, commercial milestones, competitive analysis..."
                {...register('notes')}
              />
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 pt-3 border-top border-secondary border-opacity-25">
            <button type="button" className="btn btn-crm-secondary" onClick={onHide} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-crm-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEdit ? 'Update Opportunity' : 'Create Opportunity'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default OpportunityModal;
