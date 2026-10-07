import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../common/LoadingSpinner';

const RoleRoute = ({ allowedRoles = [] }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user?.role)) {
    return (
      <div className="crm-card text-center p-5 mt-4">
        <h4 className="text-danger mb-2">Access Restricted</h4>
        <p className="text-muted mb-4">
          Your role ({user?.role}) does not have permission to access this module.
        </p>
        <a href="/dashboard" className="btn btn-crm-primary">
          Return to Dashboard
        </a>
      </div>
    );
  }

  return <Outlet />;
};

export default RoleRoute;
