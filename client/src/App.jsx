import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import RoleRoute from './components/layout/RoleRoute';

import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import CustomersPage from './pages/customers/CustomersPage';
import LeadsPage from './pages/leads/LeadsPage';
import OpportunitiesPage from './pages/opportunities/OpportunitiesPage';
import FollowUpsPage from './pages/followups/FollowUpsPage';
import ReportsPage from './pages/reports/ReportsPage';
import UsersPage from './pages/users/UsersPage';
import AuditLogPage from './pages/audit/AuditLogPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Application Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/leads" element={<LeadsPage />} />
              <Route path="/opportunities" element={<OpportunitiesPage />} />
              <Route path="/follow-ups" element={<FollowUpsPage />} />
              <Route path="/reports" element={<ReportsPage />} />

              {/* Admin-only Routes */}
              <Route element={<RoleRoute allowedRoles={['Admin']} />}>
                <Route path="/users" element={<UsersPage />} />
                <Route path="/audit-log" element={<AuditLogPage />} />
              </Route>

              {/* 404 Route */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
