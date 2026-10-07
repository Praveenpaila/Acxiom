import React, { useEffect, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { customerApi } from '../../api/customerApi';
import { AlertCircle, Building2, Mail, Phone, MapPin, UserCheck } from 'lucide-react';

const indianPhoneRegex = /^[6-9]\d{9}$/;

const customerSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters.')
    .max(100, 'Name cannot exceed 100 characters.'),
  email: z
    .string()
    .email('Enter a valid email address.'),
  phone: z
    .string()
    .regex(indianPhoneRegex, 'Enter a valid phone number.'),
  company: z
    .string()
    .min(2, 'Company name must be at least 2 characters.')
    .max(100, 'Company name cannot exceed 100 characters.'),
  address: z.string().max(250).optional().default(''),
  city: z.string().max(100).optional().default(''),
  state: z.string().max(100).optional().default(''),
  status: z.enum(['Active', 'Inactive']).default('Active'),
});

const CustomerModal = ({ show, onHide, customer = null, onSaved }) => {
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEdit = Boolean(customer?.id);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      company: '',
      address: '',
      city: '',
      state: '',
      status: 'Active',
    },
  });

  useEffect(() => {
    if (customer) {
      reset({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        company: customer.company || '',
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        status: customer.status || 'Active',
      });
    } else {
      reset({
        name: '',
        email: '',
        phone: '',
        company: '',
        address: '',
        city: '',
        state: '',
        status: 'Active',
      });
    }
    setServerError('');
  }, [customer, show, reset]);

  const onSubmit = async (formData) => {
    setServerError('');
    setIsSubmitting(true);
    try {
      if (isEdit) {
        await customerApi.updateCustomer(customer.id, formData);
      } else {
        await customerApi.createCustomer(formData);
      }
      onSaved(isEdit ? 'Customer updated successfully.' : 'Customer created successfully.');
      onHide();
    } catch (err) {
      setServerError(err.customMessage || 'Failed to save customer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static" dialogClassName="crm-modal">
      <div className="crm-card border-0 p-4" style={{ background: '#111827' }}>
        <div className="d-flex align-items-center justify-content-between mb-3 border-bottom border-secondary border-opacity-25 pb-3">
          <div className="d-flex align-items-center gap-2">
            <div className="brand-icon-box" style={{ width: '36px', height: '36px' }}>
              <Building2 size={18} />
            </div>
            <div>
              <h5 className="m-0 text-white fw-bold">
                {isEdit ? `Edit Customer (${customer?.customerCode})` : 'Add New Customer'}
              </h5>
              <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                Unique email & 10-digit Indian mobile validation enforced
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
            {/* Company Name */}
            <div className="col-12 col-md-6">
              <label className="form-label small text-secondary fw-semibold">Company Name *</label>
              <div className="input-group">
                <span className="input-group-text bg-dark border-secondary border-opacity-25 text-muted">
                  <Building2 size={15} />
                </span>
                <input
                  type="text"
                  className={`form-control crm-input ${errors.company ? 'is-invalid' : ''}`}
                  placeholder="e.g. Tata Consultancy Services"
                  {...register('company')}
                />
              </div>
              {errors.company && <div className="text-danger small mt-1">{errors.company.message}</div>}
            </div>

            {/* Primary Contact Name */}
            <div className="col-12 col-md-6">
              <label className="form-label small text-secondary fw-semibold">Contact Person *</label>
              <div className="input-group">
                <span className="input-group-text bg-dark border-secondary border-opacity-25 text-muted">
                  <UserCheck size={15} />
                </span>
                <input
                  type="text"
                  className={`form-control crm-input ${errors.name ? 'is-invalid' : ''}`}
                  placeholder="e.g. Rohan Mehra"
                  {...register('name')}
                />
              </div>
              {errors.name && <div className="text-danger small mt-1">{errors.name.message}</div>}
            </div>

            {/* Email Address */}
            <div className="col-12 col-md-6">
              <label className="form-label small text-secondary fw-semibold">Corporate Email *</label>
              <div className="input-group">
                <span className="input-group-text bg-dark border-secondary border-opacity-25 text-muted">
                  <Mail size={15} />
                </span>
                <input
                  type="email"
                  className={`form-control crm-input ${errors.email ? 'is-invalid' : ''}`}
                  placeholder="name@company.in"
                  {...register('email')}
                />
              </div>
              {errors.email && <div className="text-danger small mt-1">{errors.email.message}</div>}
            </div>

            {/* Phone (Indian Mobile) */}
            <div className="col-12 col-md-6">
              <label className="form-label small text-secondary fw-semibold">Mobile Phone (10 digits) *</label>
              <div className="input-group">
                <span className="input-group-text bg-dark border-secondary border-opacity-25 text-muted">
                  <Phone size={15} />
                </span>
                <input
                  type="tel"
                  className={`form-control crm-input ${errors.phone ? 'is-invalid' : ''}`}
                  placeholder="9820011223"
                  maxLength={10}
                  {...register('phone')}
                />
              </div>
              {errors.phone && <div className="text-danger small mt-1">{errors.phone.message}</div>}
            </div>

            {/* Address */}
            <div className="col-12">
              <label className="form-label small text-secondary fw-semibold">Office Address</label>
              <div className="input-group">
                <span className="input-group-text bg-dark border-secondary border-opacity-25 text-muted">
                  <MapPin size={15} />
                </span>
                <input
                  type="text"
                  className="form-control crm-input"
                  placeholder="Building, Street, Landmark"
                  {...register('address')}
                />
              </div>
            </div>

            {/* City */}
            <div className="col-12 col-md-5">
              <label className="form-label small text-secondary fw-semibold">City</label>
              <input
                type="text"
                className="form-control crm-input"
                placeholder="e.g. Mumbai, Bengaluru"
                {...register('city')}
              />
            </div>

            {/* State */}
            <div className="col-12 col-md-4">
              <label className="form-label small text-secondary fw-semibold">State</label>
              <input
                type="text"
                className="form-control crm-input"
                placeholder="e.g. Maharashtra"
                {...register('state')}
              />
            </div>

            {/* Status */}
            <div className="col-12 col-md-3">
              <label className="form-label small text-secondary fw-semibold">Status</label>
              <select className="form-select crm-input" {...register('status')}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 pt-3 border-top border-secondary border-opacity-25">
            <button type="button" className="btn btn-crm-secondary" onClick={onHide} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-crm-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEdit ? 'Update Customer' : 'Create Customer'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default CustomerModal;
