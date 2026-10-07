import React, { useEffect, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { userApi } from '../../api/userApi';
import { User, Mail, Phone, Shield, Lock, AlertCircle, Users } from 'lucide-react';

const indianPhoneRegex = /^[6-9]\d{9}$/;

const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.').max(100),
  email: z.string().email('Enter a valid email address.'),
  phone: z.string().regex(indianPhoneRegex, 'Enter a valid 10-digit Indian phone number.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter.')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter.')
    .regex(/[0-9]/, 'Must contain at least one digit.')
    .regex(/[^A-Za-z0-9]/, 'Must contain at least one symbol.'),
  role: z.enum(['Admin', 'Manager', 'SalesExecutive']),
  reportingTo: z.string().optional(),
});

const editUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.').max(100),
  phone: z.string().regex(indianPhoneRegex, 'Enter a valid 10-digit Indian phone number.'),
  role: z.enum(['Admin', 'Manager', 'SalesExecutive']),
  reportingTo: z.string().optional(),
});

const UserModal = ({ show, onHide, user = null, managers = [], onSaved }) => {
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEdit = Boolean(user?.id);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(isEdit ? editUserSchema : createUserSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'SalesExecutive',
      reportingTo: '',
    },
  });

  const selectedRole = watch('role');

  useEffect(() => {
    setServerError('');
    if (user) {
      reset({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'SalesExecutive',
        reportingTo: user.reportingTo?._id || user.reportingTo?.id || user.reportingTo || '',
      });
    } else {
      reset({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'SalesExecutive',
        reportingTo: '',
      });
    }
  }, [user, show, reset]);

  const onSubmit = async (data) => {
    setServerError('');
    setIsSubmitting(true);
    try {
      const payload = { ...data };
      if (!payload.reportingTo) {
        payload.reportingTo = null;
      }

      if (isEdit) {
        await userApi.updateUser(user.id, payload);
      } else {
        await userApi.createUser(payload);
      }
      onSaved();
      onHide();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Operation failed.';
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static" className="crm-modal">
      <div className="modal-content" style={{ background: '#0b1120', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
        <Modal.Header closeButton closeVariant="white" className="border-bottom border-dark px-4 py-3">
          <Modal.Title className="h6 text-white mb-0 d-flex align-items-center gap-2">
            <User size={18} className="text-primary" />
            {isEdit ? `Edit User: ${user?.name}` : 'Provision New System User'}
          </Modal.Title>
        </Modal.Header>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Modal.Body className="px-4 py-3">
            {serverError && (
              <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-3">
                <AlertCircle size={16} />
                <span>{serverError}</span>
              </div>
            )}

            <div className="row g-3">
              <div className="col-12">
                <label className="crm-label">Full Name *</label>
                <div className="input-group">
                  <span className="input-group-text bg-dark border-secondary text-muted">
                    <User size={15} />
                  </span>
                  <input
                    type="text"
                    className={`form-control crm-input ${errors.name ? 'is-invalid' : ''}`}
                    placeholder="e.g. Rahul Sharma"
                    {...register('name')}
                  />
                </div>
                {errors.name && <div className="text-danger small mt-1">{errors.name.message}</div>}
              </div>

              {!isEdit && (
                <div className="col-md-6">
                  <label className="crm-label">Email Address *</label>
                  <div className="input-group">
                    <span className="input-group-text bg-dark border-secondary text-muted">
                      <Mail size={15} />
                    </span>
                    <input
                      type="email"
                      className={`form-control crm-input ${errors.email ? 'is-invalid' : ''}`}
                      placeholder="e.g. rahul@acxiomcrm.internal"
                      {...register('email')}
                    />
                  </div>
                  {errors.email && <div className="text-danger small mt-1">{errors.email.message}</div>}
                </div>
              )}

              <div className={isEdit ? 'col-12' : 'col-md-6'}>
                <label className="crm-label">Phone Number *</label>
                <div className="input-group">
                  <span className="input-group-text bg-dark border-secondary text-muted">
                    <Phone size={15} />
                  </span>
                  <input
                    type="text"
                    className={`form-control crm-input ${errors.phone ? 'is-invalid' : ''}`}
                    placeholder="10-digit mobile (e.g. 9876543210)"
                    {...register('phone')}
                  />
                </div>
                {errors.phone && <div className="text-danger small mt-1">{errors.phone.message}</div>}
              </div>

              {!isEdit && (
                <div className="col-12">
                  <label className="crm-label">Temporary Password *</label>
                  <div className="input-group">
                    <span className="input-group-text bg-dark border-secondary text-muted">
                      <Lock size={15} />
                    </span>
                    <input
                      type="password"
                      className={`form-control crm-input ${errors.password ? 'is-invalid' : ''}`}
                      placeholder="Min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 symbol"
                      {...register('password')}
                    />
                  </div>
                  {errors.password && <div className="text-danger small mt-1">{errors.password.message}</div>}
                </div>
              )}

              <div className="col-md-6">
                <label className="crm-label">System Role *</label>
                <div className="input-group">
                  <span className="input-group-text bg-dark border-secondary text-muted">
                    <Shield size={15} />
                  </span>
                  <select
                    className={`form-select crm-input ${errors.role ? 'is-invalid' : ''}`}
                    {...register('role')}
                  >
                    <option value="SalesExecutive">Sales Executive</option>
                    <option value="Manager">Manager</option>
                    <option value="Admin">Administrator</option>
                  </select>
                </div>
                {errors.role && <div className="text-danger small mt-1">{errors.role.message}</div>}
              </div>

              {selectedRole !== 'Admin' && (
                <div className="col-md-6">
                  <label className="crm-label">Reporting Manager</label>
                  <div className="input-group">
                    <span className="input-group-text bg-dark border-secondary text-muted">
                      <Users size={15} />
                    </span>
                    <select
                      className="form-select crm-input"
                      {...register('reportingTo')}
                    >
                      <option value="">None / Direct</option>
                      {managers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.role})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </Modal.Body>

          <Modal.Footer className="border-top border-dark px-4 py-3">
            <button type="button" className="btn btn-crm-secondary" onClick={onHide} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-crm-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEdit ? 'Update User' : 'Create User'}
            </button>
          </Modal.Footer>
        </form>
      </div>
    </Modal>
  );
};

export default UserModal;
