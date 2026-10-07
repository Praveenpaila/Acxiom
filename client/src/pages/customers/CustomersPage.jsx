import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader';
import CustomerModal from './CustomerModal';
import CustomerDetailModal from './CustomerDetailModal';
import { customerApi } from '../../api/customerApi';
import { formatDate, getRoleBadgeClass } from '../../utils/formatters';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [viewCustomer, setViewCustomer] = useState(null);

  // Feedback notifications
  const [feedback, setFeedback] = useState(null);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await customerApi.getCustomers({
        page: pagination.page,
        limit: pagination.limit,
        search,
        status: statusFilter,
      });

      if (data.success) {
        setCustomers(data.customers);
        setPagination(data.pagination);
      }
    } catch (err) {
      setFeedback({ type: 'danger', message: err.customMessage || 'Failed to load customers.' });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, statusFilter]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleCreate = () => {
    setSelectedCustomer(null);
    setShowModal(true);
  };

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setShowModal(true);
  };

  const handleView = (customer) => {
    setViewCustomer(customer);
  };

  const handleDelete = async (customer) => {
    const isConfirm = window.confirm(
      `Are you sure you want to deactivate or remove customer "${customer.company}" (${customer.customerCode})?`
    );
    if (!isConfirm) return;

    try {
      const res = await customerApi.deleteCustomer(customer.id);
      setFeedback({ type: 'success', message: res.message || 'Customer deleted successfully.' });
      fetchCustomers();
    } catch (err) {
      setFeedback({ type: 'danger', message: err.customMessage || 'Failed to delete customer.' });
    }
  };

  const handleSaved = (message) => {
    setFeedback({ type: 'success', message });
    fetchCustomers();
  };

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Manage client accounts, unique identifiers, and contact details."
      >
        <button
          onClick={handleCreate}
          className="btn btn-crm-primary d-flex align-items-center gap-2"
        >
          <Plus size={16} /> Add Customer
        </button>
      </PageHeader>

      {/* Feedback Toast Banner */}
      {feedback && (
        <div
          className={`alert alert-${feedback.type} alert-dismissible d-flex align-items-center gap-2 py-2 px-3 small mb-3 border-0 bg-${feedback.type} bg-opacity-10 text-${feedback.type}`}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <div>{feedback.message}</div>
          <button
            type="button"
            className="btn-close ms-auto p-2"
            onClick={() => setFeedback(null)}
            aria-label="Close"
          />
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="crm-card mb-4">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-6 col-lg-5">
            <div className="input-group">
              <span className="input-group-text bg-dark border-secondary border-opacity-25 text-muted">
                <Search size={16} />
              </span>
              <input
                type="text"
                className="form-control crm-input"
                placeholder="Search by name, company, email, phone or code..."
                value={search}
                onChange={handleSearchChange}
              />
            </div>
          </div>

          <div className="col-6 col-md-3 col-lg-3">
            <div className="input-group">
              <span className="input-group-text bg-dark border-secondary border-opacity-25 text-muted">
                <Filter size={15} />
              </span>
              <select
                className="form-select crm-input"
                value={statusFilter}
                onChange={handleStatusChange}
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active Only</option>
                <option value="Inactive">Inactive Only</option>
              </select>
            </div>
          </div>

          <div className="col-6 col-md-3 col-lg-4 d-flex justify-content-end gap-2">
            <button
              onClick={fetchCustomers}
              className="btn btn-crm-secondary d-flex align-items-center gap-2"
              title="Refresh List"
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              <span className="d-none d-sm-inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Customer Data Table */}
      <div className="crm-card p-0 overflow-hidden">
        {loading && customers.length === 0 ? (
          <LoadingSpinner message="Fetching customers..." />
        ) : customers.length === 0 ? (
          <div className="text-center py-5">
            <div
              className="brand-icon-box mx-auto mb-3"
              style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8' }}
            >
              <Building2 size={24} />
            </div>
            <h5 className="text-white mb-1">No Customers Found</h5>
            <p className="text-muted small mx-auto" style={{ maxWidth: '360px' }}>
              {search || statusFilter !== 'All'
                ? 'No matching customer records found for the applied filter.'
                : 'Get started by creating your first customer account.'}
            </p>
            {(!search && statusFilter === 'All') && (
              <button onClick={handleCreate} className="btn btn-crm-primary btn-sm mt-2">
                <Plus size={15} /> Add First Customer
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="crm-table">
              <thead>
                <tr>
                  <th style={{ width: '130px' }}>Code</th>
                  <th>Company & Contact</th>
                  <th>Contact Info</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th className="text-end" style={{ width: '130px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    {/* Code */}
                    <td>
                      <span className="badge bg-primary bg-opacity-15 text-primary fw-mono" style={{ fontSize: '0.78rem' }}>
                        {c.customerCode}
                      </span>
                    </td>

                    {/* Company & Name */}
                    <td>
                      <div className="fw-semibold text-white">{c.company}</div>
                      <div className="text-muted small" style={{ fontSize: '0.78rem' }}>
                        {c.name}
                      </div>
                    </td>

                    {/* Email & Phone */}
                    <td>
                      <div className="d-flex align-items-center gap-1 small text-secondary">
                        <Mail size={13} className="text-muted" /> {c.email}
                      </div>
                      <div className="d-flex align-items-center gap-1 small text-secondary mt-1">
                        <Phone size={13} className="text-muted" /> +91 {c.phone}
                      </div>
                    </td>

                    {/* Location */}
                    <td>
                      <div className="d-flex align-items-center gap-1 small text-secondary">
                        <MapPin size={13} className="text-muted" />
                        {[c.city, c.state].filter(Boolean).join(', ') || '—'}
                      </div>
                    </td>

                    {/* Status */}
                    <td>
                      <span
                        className={`badge ${c.status === 'Active' ? 'bg-success bg-opacity-25 text-success' : 'bg-secondary bg-opacity-25 text-secondary'}`}
                        style={{ fontSize: '0.75rem' }}
                      >
                        {c.status}
                      </span>
                    </td>

                    {/* Created By */}
                    <td>
                      <div className="small text-white">{c.createdBy?.name || 'Admin'}</div>
                      {c.createdBy?.role && (
                        <span className={getRoleBadgeClass(c.createdBy.role)} style={{ fontSize: '0.68rem' }}>
                          {c.createdBy.role}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="text-end">
                      <div className="d-flex align-items-center justify-content-end gap-1">
                        <button
                          onClick={() => handleView(c)}
                          className="btn btn-sm btn-outline-secondary p-1"
                          title="View Details"
                          style={{ width: '30px', height: '30px', borderRadius: '7px' }}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handleEdit(c)}
                          className="btn btn-sm btn-outline-primary p-1"
                          title="Edit Customer"
                          style={{ width: '30px', height: '30px', borderRadius: '7px' }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          className="btn btn-sm btn-outline-danger p-1"
                          title="Deactivate / Delete"
                          style={{ width: '30px', height: '30px', borderRadius: '7px' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.total > 0 && (
          <div className="d-flex flex-column flex-sm-row align-items-center justify-content-between p-3 border-top border-secondary border-opacity-10 gap-3">
            <div className="text-muted small">
              Showing{' '}
              <span className="text-white fw-semibold">
                {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}
              </span>{' '}
              to{' '}
              <span className="text-white fw-semibold">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{' '}
              of <span className="text-white fw-semibold">{pagination.total}</span> customers
            </div>

            <div className="d-flex align-items-center gap-2">
              <select
                className="form-select form-select-sm crm-input py-1 px-2"
                style={{ width: '90px' }}
                value={pagination.limit}
                onChange={(e) =>
                  setPagination((prev) => ({ ...prev, limit: Number(e.target.value), page: 1 }))
                }
              >
                <option value={5}>5 / page</option>
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
              </select>

              <button
                className="btn btn-sm btn-crm-secondary p-1"
                disabled={pagination.page <= 1}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                title="Previous Page"
              >
                <ChevronLeft size={16} />
              </button>

              <span className="text-muted small px-2">
                Page {pagination.page} of {pagination.totalPages}
              </span>

              <button
                className="btn btn-sm btn-crm-secondary p-1"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                title="Next Page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Customer Create/Edit Modal */}
      <CustomerModal
        show={showModal}
        onHide={() => setShowModal(false)}
        customer={selectedCustomer}
        onSaved={handleSaved}
      />

      {/* Customer Detail Modal */}
      <CustomerDetailModal
        show={Boolean(viewCustomer)}
        onHide={() => setViewCustomer(null)}
        customer={viewCustomer}
      />
    </div>
  );
};

export default CustomersPage;
