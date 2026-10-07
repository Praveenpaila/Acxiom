import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader';
import UserModal from './UserModal';
import ResetPasswordModal from './ResetPasswordModal';
import { userApi } from '../../api/userApi';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  UserPlus,
  Shield,
  Search,
  KeyRound,
  Unlock,
  Power,
  Edit2,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

const UsersPage = () => {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [alert, setAlert] = useState(null);

  // Modals state
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [userForReset, setUserForReset] = useState(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (roleFilter !== 'All') params.role = roleFilter;
      if (statusFilter !== 'All') params.isActive = statusFilter === 'Active' ? 'true' : 'false';

      const data = await userApi.getUsers(params);
      setUsers(data.users || []);
    } catch (err) {
      setAlert({ type: 'danger', message: 'Failed to load users.' });
    } finally {
      setIsLoading(false);
    }
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const handleToggleStatus = async (targetUser) => {
    if (targetUser.id === currentUser?.id) {
      setAlert({ type: 'danger', message: 'You cannot deactivate your own admin account.' });
      return;
    }

    try {
      await userApi.toggleStatus(targetUser.id, !targetUser.isActive);
      setAlert({
        type: 'success',
        message: `User ${targetUser.name} has been ${!targetUser.isActive ? 'activated' : 'deactivated'}.`,
      });
      fetchUsers();
    } catch (err) {
      setAlert({
        type: 'danger',
        message: err.response?.data?.message || 'Failed to update user status.',
      });
    }
  };

  const handleResetLockout = async (targetUser) => {
    try {
      await userApi.resetLockout(targetUser.id);
      setAlert({
        type: 'success',
        message: `Account lockout cleared for ${targetUser.name}.`,
      });
      fetchUsers();
    } catch (err) {
      setAlert({
        type: 'danger',
        message: err.response?.data?.message || 'Failed to unlock account.',
      });
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'Admin':
        return 'badge-role-admin';
      case 'Manager':
        return 'badge-role-manager';
      case 'SalesExecutive':
        return 'badge-role-sales';
      default:
        return 'badge bg-secondary';
    }
  };

  const managersList = users.filter((u) => u.role === 'Manager' || u.role === 'Admin');

  return (
    <div>
      <PageHeader
        title="User & Role Management"
        subtitle="Provision employee accounts, manage organizational hierarchy, and resolve account lockouts."
      >
        <button
          className="btn btn-crm-primary d-flex align-items-center gap-2"
          onClick={() => {
            setSelectedUser(null);
            setShowUserModal(true);
          }}
        >
          <UserPlus size={16} /> Create User
        </button>
      </PageHeader>

      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show d-flex align-items-center justify-content-between py-2 px-3 mb-3 small`}>
          <span>{alert.message}</span>
          <button type="button" className="btn-close btn-close-white" onClick={() => setAlert(null)}></button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="crm-card mb-4 p-3">
        <div className="row g-2 align-items-center">
          <div className="col-md-5">
            <div className="input-group">
              <span className="input-group-text bg-dark border-secondary text-muted">
                <Search size={15} />
              </span>
              <input
                type="text"
                className="form-control crm-input"
                placeholder="Search by name, email, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="col-md-3">
            <select
              className="form-select crm-input"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="All">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="SalesExecutive">Sales Executive</option>
            </select>
          </div>

          <div className="col-md-3">
            <select
              className="form-select crm-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Deactivated">Deactivated</option>
            </select>
          </div>

          <div className="col-md-1 d-flex justify-content-end">
            <button
              className="btn btn-crm-secondary p-2"
              title="Refresh Users"
              onClick={fetchUsers}
            >
              <RefreshCw size={15} className={isLoading ? 'spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="crm-card p-0 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-dark table-hover crm-table align-middle mb-0">
            <thead>
              <tr>
                <th className="ps-3">Name & Email</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Reporting To</th>
                <th>Status</th>
                <th>Lockout State</th>
                <th className="text-end pe-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                    Loading system users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isCurrent = u.id === currentUser?.id;
                  return (
                    <tr key={u.id}>
                      <td className="ps-3">
                        <div className="fw-semibold text-white d-flex align-items-center gap-2">
                          {u.name}
                          {isCurrent && (
                            <span className="badge bg-secondary" style={{ fontSize: '0.65rem' }}>
                              You
                            </span>
                          )}
                        </div>
                        <div className="small text-muted">{u.email}</div>
                      </td>
                      <td>
                        <span className={`badge ${getRoleBadgeClass(u.role)}`}>{u.role}</span>
                      </td>
                      <td className="text-muted small">{u.phone || '—'}</td>
                      <td className="text-muted small">
                        {u.reportingTo?.name ? (
                          <span>
                            {u.reportingTo.name}{' '}
                            <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                              ({u.reportingTo.role})
                            </span>
                          </span>
                        ) : (
                          <span className="text-muted fst-italic">Direct / None</span>
                        )}
                      </td>
                      <td>
                        {u.isActive ? (
                          <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                            Active
                          </span>
                        ) : (
                          <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">
                            Deactivated
                          </span>
                        )}
                      </td>
                      <td>
                        {u.isLocked ? (
                          <div className="d-flex align-items-center gap-1">
                            <span className="badge bg-danger d-flex align-items-center gap-1">
                              <AlertTriangle size={12} /> Locked
                            </span>
                            <button
                              className="btn btn-sm btn-outline-warning p-1 py-0 ms-1"
                              title="Unlock Account"
                              onClick={() => handleResetLockout(u)}
                            >
                              <Unlock size={12} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted small">Normal</span>
                        )}
                      </td>
                      <td className="text-end pe-3">
                        <div className="btn-group">
                          <button
                            className="btn btn-sm btn-crm-secondary p-1 px-2"
                            title="Edit User"
                            onClick={() => {
                              setSelectedUser(u);
                              setShowUserModal(true);
                            }}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            className="btn btn-sm btn-crm-secondary p-1 px-2 ms-1 text-warning"
                            title="Reset Password"
                            onClick={() => {
                              setUserForReset(u);
                              setShowResetModal(true);
                            }}
                          >
                            <KeyRound size={13} />
                          </button>
                          {!isCurrent && (
                            <button
                              className={`btn btn-sm btn-crm-secondary p-1 px-2 ms-1 ${
                                u.isActive ? 'text-danger' : 'text-success'
                              }`}
                              title={u.isActive ? 'Deactivate User' : 'Activate User'}
                              onClick={() => handleToggleStatus(u)}
                            >
                              <Power size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Create/Edit Modal */}
      <UserModal
        show={showUserModal}
        onHide={() => setShowUserModal(false)}
        user={selectedUser}
        managers={managersList}
        onSaved={() => {
          setAlert({
            type: 'success',
            message: selectedUser ? 'User updated successfully.' : 'User created successfully.',
          });
          fetchUsers();
        }}
      />

      {/* Reset Password Modal */}
      <ResetPasswordModal
        show={showResetModal}
        onHide={() => setShowResetModal(false)}
        user={userForReset}
        onSaved={() => {
          setAlert({
            type: 'success',
            message: `Password has been reset for ${userForReset?.name}.`,
          });
          fetchUsers();
        }}
      />
    </div>
  );
};

export default UsersPage;
