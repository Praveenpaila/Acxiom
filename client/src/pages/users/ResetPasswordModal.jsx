import React, { useState } from 'react';
import { Modal } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { userApi } from '../../api/userApi';
import { KeyRound, Lock, AlertCircle, CheckCircle } from 'lucide-react';

const resetSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter.')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter.')
    .regex(/[0-9]/, 'Must contain at least one digit.')
    .regex(/[^A-Za-z0-9]/, 'Must contain at least one symbol.'),
});

const ResetPasswordModal = ({ show, onHide, user, onSaved }) => {
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '' },
  });

  const onSubmit = async (data) => {
    if (!user) return;
    setServerError('');
    setIsSubmitting(true);
    try {
      await userApi.resetPassword(user.id, data.password);
      reset();
      onSaved();
      onHide();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to reset password.';
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
            <KeyRound size={18} className="text-warning" />
            Reset Password for {user?.name}
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

            <p className="text-muted small mb-3">
              Enter a new secure password. This will immediately reset any lockout counters and allow the user to log in.
            </p>

            <div className="mb-3">
              <label className="crm-label">New Password *</label>
              <div className="input-group">
                <span className="input-group-text bg-dark border-secondary text-muted">
                  <Lock size={15} />
                </span>
                <input
                  type="password"
                  className={`form-control crm-input ${errors.password ? 'is-invalid' : ''}`}
                  placeholder="At least 8 chars, uppercase, lowercase, digit, symbol"
                  {...register('password')}
                />
              </div>
              {errors.password && <div className="text-danger small mt-1">{errors.password.message}</div>}
            </div>
          </Modal.Body>

          <Modal.Footer className="border-top border-dark px-4 py-3">
            <button type="button" className="btn btn-crm-secondary" onClick={onHide} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-crm-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Set New Password'}
            </button>
          </Modal.Footer>
        </form>
      </div>
    </Modal>
  );
};

export default ResetPasswordModal;
