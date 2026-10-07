import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../hooks/useAuth';
import { ShieldCheck, Eye, EyeOff, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required.')
    .email('Enter a valid email address.'),
  password: z
    .string()
    .min(1, 'Password is required.'),
});

const DEMO_ACCOUNTS = [
  {
    role: 'Admin',
    name: 'Rajesh Sharma',
    email: 'rajesh.sharma@acxiomcrm.internal',
    password: 'Admin@Acxiom2026!',
    badge: 'badge-role-admin',
  },
  {
    role: 'Manager',
    name: 'Priya Nair',
    email: 'priya.nair@acxiomcrm.internal',
    password: 'Manager@Acxiom2026!',
    badge: 'badge-role-manager',
  },
  {
    role: 'SalesExecutive',
    name: 'Amit Patel',
    email: 'amit.patel@acxiomcrm.internal',
    password: 'Sales@Acxiom2026!',
    badge: 'badge-role-exec',
  },
];

const LoginPage = () => {
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  if (isAuthenticated && !loading) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (data) => {
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      await login(data);
      navigate('/dashboard');
    } catch (err) {
      setErrorMessage(err.customMessage || 'Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectDemo = (acc) => {
    setValue('email', acc.email, { shouldValidate: true });
    setValue('password', acc.password, { shouldValidate: true });
    setErrorMessage('');
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        {/* Brand Header */}
        <div className="text-center mb-4">
          <div
            className="brand-icon-box mx-auto mb-3"
            style={{ width: '48px', height: '48px', borderRadius: '12px' }}
          >
            <ShieldCheck size={28} />
          </div>
          <h2 className="brand-title fs-3 mb-1">
            Acxiom<span>CRM</span>
          </h2>
          <p className="text-muted small m-0">Sign in to your enterprise account</p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="alert alert-danger d-flex align-items-center gap-2 p-2 small mb-3 border-0 bg-danger bg-opacity-10 text-danger">
            <AlertCircle size={16} className="flex-shrink-0" />
            <div>{errorMessage}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-3">
            <label className="form-label small text-secondary fw-semibold">Email Address</label>
            <div className="input-group">
              <span className="input-group-text bg-dark border-secondary border-opacity-25 text-muted">
                <Mail size={16} />
              </span>
              <input
                type="email"
                className={`form-control crm-input ${errors.email ? 'is-invalid' : ''}`}
                placeholder="name@acxiomcrm.internal"
                autoComplete="email"
                {...register('email')}
              />
            </div>
            {errors.email && (
              <div className="text-danger small mt-1">{errors.email.message}</div>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label small text-secondary fw-semibold">Password</label>
            <div className="input-group">
              <span className="input-group-text bg-dark border-secondary border-opacity-25 text-muted">
                <Lock size={16} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                className={`form-control crm-input ${errors.password ? 'is-invalid' : ''}`}
                placeholder="••••••••••••"
                autoComplete="current-password"
                {...register('password')}
              />
              <button
                type="button"
                className="input-group-text bg-dark border-secondary border-opacity-25 text-muted"
                onClick={() => setShowPassword(!showPassword)}
                style={{ cursor: 'pointer' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <div className="text-danger small mt-1">{errors.password.message}</div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-crm-primary w-100 py-2 mt-2 d-flex align-items-center justify-content-center gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Demo Fast Login Pills */}
        <div className="mt-4 pt-3 border-top border-secondary border-opacity-25">
          <div className="text-muted small fw-semibold mb-2" style={{ fontSize: '0.75rem' }}>
            QUICK LOGIN DEMO ACCOUNTS:
          </div>
          <div className="d-flex flex-column gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <div
                key={acc.role}
                className="demo-account-pill"
                onClick={() => handleSelectDemo(acc)}
                title={`Click to fill ${acc.name} (${acc.role})`}
              >
                <div>
                  <div className="fw-semibold text-white">{acc.name}</div>
                  <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                    {acc.email}
                  </div>
                </div>
                <span className={acc.badge}>{acc.role}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
