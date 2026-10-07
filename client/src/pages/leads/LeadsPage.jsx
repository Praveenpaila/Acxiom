import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader';
import LeadModal from './LeadModal';
import ConvertLeadModal from './ConvertLeadModal';
import LeadDetailModal from './LeadDetailModal';
import { leadApi } from '../../api/leadApi';
import { formatCurrency, getRoleBadgeClass } from '../../utils/formatters';
import {
  UserCheck,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Phone,
  Mail,
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const LeadsPage = () => {
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [viewLead, setViewLead] = useState(null);
  const [convertLead, setConvertLead] = useState(null);

  // Feedback notifications
  const [feedback, setFeedback] = useState(null);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const data = await leadApi.getLeads({
        page: pagination.page,
        limit: pagination.limit,
        search,
        status: statusFilter,
      });

      if (data.success) {
        setLeads(data.leads);
        setPagination(data.pagination);
      }
    } catch (err) {
      setFeedback({ type: 'danger', message: err.customMessage || 'Failed to load leads.' });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, statusFilter]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleCreate = () => {
    setSelectedLead(null);
    setShowModal(true);
  };

  const handleEdit = (lead) => {
    setSelectedLead(lead);
    setShowModal(true);
  };

  const handleView = (lead) => {
    setViewLead(lead);
  };

  const handleStatusTransition = async (leadId, nextStatus) => {
    try {
      const res = await leadApi.updateLeadStatus(leadId, nextStatus);
      setFeedback({ type: 'success', message: res.message || 'Status updated.' });
      if (viewLead && viewLead.id === leadId) {
        setViewLead(res.lead);
      }
      fetchLeads();
    } catch (err) {
      setFeedback({ type: 'danger', message: err.customMessage || 'Failed to update status.' });
    }
  };

  const handleDelete = async (lead) => {
    if (lead.status === 'Converted') {
      alert('Converted leads cannot be removed.');
      return;
    }

    const isConfirm = window.confirm(`Are you sure you want to delete lead "${lead.company}"?`);
    if (!isConfirm) return;

    try {
      const res = await leadApi.deleteLead(lead.id);
      setFeedback({ type: 'success', message: res.message || 'Lead deleted successfully.' });
      fetchLeads();
    } catch (err) {
      setFeedback({ type: 'danger', message: err.customMessage || 'Failed to delete lead.' });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'New':
        return 'bg-primary bg-opacity-25 text-primary';
      case 'Contacted':
        return 'bg-info bg-opacity-25 text-info';
      case 'Qualified':
        return 'bg-success bg-opacity-25 text-success';
      case 'Converted':
        return 'bg-purple bg-opacity-25 text-purple';
      case 'Unqualified':
        return 'bg-secondary bg-opacity-25 text-secondary';
      case 'Lost':
        return 'bg-danger bg-opacity-25 text-danger';
      default:
        return 'bg-secondary';
    }
  };

  return (
    <div>
      <PageHeader
        title="Leads Pipeline"
        subtitle="Inbound prospects, qualification lifecycle transitions, and customer conversion."
      >
        <button onClick={handleCreate} className="btn btn-crm-primary d-flex align-items-center gap-2">
          <Plus size={16} /> Add Lead
        </button>
      </PageHeader>

      {/* Feedback Banner */}
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

      {/* Filters and Search Bar */}
      <div className="crm-card mb-4">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-5 col-lg-5">
            <div className="input-group">
              <span className="input-group-text bg-dark border-secondary border-opacity-25 text-muted">
                <Search size={16} />
              </span>
              <input
                type="text"
                className="form-control crm-input"
                placeholder="Search leads by prospect, company, email, phone or code..."
                value={search}
                onChange={handleSearchChange}
              />
            </div>
          </div>

          <div className="col-6 col-md-4 col-lg-3">
            <div className="input-group">
              <span className="input-group-text bg-dark border-secondary border-opacity-25 text-muted">
                <Filter size={15} />
              </span>
              <select
                className="form-select crm-input"
                value={statusFilter}
                onChange={handleStatusChange}
              >
                <option value="All">All Stages</option>
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Converted">Converted</option>
                <option value="Unqualified">Unqualified</option>
                <option value="Lost">Lost</option>
              </select>
            </div>
          </div>

          <div className="col-6 col-md-3 col-lg-4 d-flex justify-content-end gap-2">
            <button
              onClick={fetchLeads}
              className="btn btn-crm-secondary d-flex align-items-center gap-2"
              title="Refresh Leads"
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              <span className="d-none d-sm-inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Leads Data Table */}
      <div className="crm-card p-0 overflow-hidden">
        {loading && leads.length === 0 ? (
          <LoadingSpinner message="Fetching sales prospects..." />
        ) : leads.length === 0 ? (
          <div className="text-center py-5">
            <div
              className="brand-icon-box mx-auto mb-3"
              style={{ background: 'rgba(14, 165, 233, 0.1)', color: '#38bdf8' }}
            >
              <UserCheck size={24} />
            </div>
            <h5 className="text-white mb-1">No Leads Found</h5>
            <p className="text-muted small mx-auto" style={{ maxWidth: '360px' }}>
              {search || statusFilter !== 'All'
                ? 'No matching leads found for current criteria.'
                : 'Capture your first inbound lead to begin the qualification lifecycle.'}
            </p>
            {(!search && statusFilter === 'All') && (
              <button onClick={handleCreate} className="btn btn-crm-primary btn-sm mt-2">
                <Plus size={15} /> Add First Lead
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="crm-table">
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>Code</th>
                  <th>Prospect & Company</th>
                  <th>Contact Info</th>
                  <th>Expected Value</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th className="text-end" style={{ width: '150px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id}>
                    {/* Code */}
                    <td>
                      <span className="badge bg-info bg-opacity-15 text-info fw-mono" style={{ fontSize: '0.78rem' }}>
                        {l.leadCode}
                      </span>
                    </td>

                    {/* Prospect & Company */}
                    <td>
                      <div className="fw-semibold text-white">{l.company}</div>
                      <div className="text-muted small" style={{ fontSize: '0.78rem' }}>
                        {l.name}
                      </div>
                    </td>

                    {/* Contact Info */}
                    <td>
                      <div className="d-flex align-items-center gap-1 small text-secondary">
                        <Mail size={13} className="text-muted" /> {l.email}
                      </div>
                      <div className="d-flex align-items-center gap-1 small text-secondary mt-1">
                        <Phone size={13} className="text-muted" /> +91 {l.phone}
                      </div>
                    </td>

                    {/* Expected Value */}
                    <td>
                      <span className="fw-semibold text-white">
                        {formatCurrency(l.expectedValue)}
                      </span>
                    </td>

                    {/* Source */}
                    <td>
                      <span className="badge bg-dark text-secondary border border-secondary border-opacity-25" style={{ fontSize: '0.72rem' }}>
                        {l.source}
                      </span>
                    </td>

                    {/* Status */}
                    <td>
                      <span className={`badge ${getStatusBadge(l.status)}`} style={{ fontSize: '0.75rem' }}>
                        {l.status}
                      </span>
                    </td>

                    {/* Assigned To */}
                    <td>
                      <div className="small text-white">{l.assignedTo?.name || 'Unassigned'}</div>
                      {l.assignedTo?.role && (
                        <span className={getRoleBadgeClass(l.assignedTo.role)} style={{ fontSize: '0.65rem' }}>
                          {l.assignedTo.role}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="text-end">
                      <div className="d-flex align-items-center justify-content-end gap-1">
                        {/* Quick convert button if Qualified */}
                        {l.status === 'Qualified' && (
                          <button
                            onClick={() => setConvertLead(l)}
                            className="btn btn-sm btn-success p-1 d-flex align-items-center justify-content-center"
                            title="Convert to Deal"
                            style={{ width: '30px', height: '30px', borderRadius: '7px' }}
                          >
                            <Sparkles size={14} />
                          </button>
                        )}

                        <button
                          onClick={() => handleView(l)}
                          className="btn btn-sm btn-outline-secondary p-1"
                          title="View Lead Lifecycle"
                          style={{ width: '30px', height: '30px', borderRadius: '7px' }}
                        >
                          <Eye size={14} />
                        </button>

                        {l.status !== 'Converted' && (
                          <button
                            onClick={() => handleEdit(l)}
                            className="btn btn-sm btn-outline-primary p-1"
                            title="Edit Lead"
                            style={{ width: '30px', height: '30px', borderRadius: '7px' }}
                          >
                            <Edit2 size={14} />
                          </button>
                        )}

                        {l.status !== 'Converted' && (
                          <button
                            onClick={() => handleDelete(l)}
                            className="btn btn-sm btn-outline-danger p-1"
                            title="Delete Lead"
                            style={{ width: '30px', height: '30px', borderRadius: '7px' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
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
              of <span className="text-white fw-semibold">{pagination.total}</span> prospects
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

      {/* Lead Create/Edit Modal */}
      <LeadModal
        show={showModal}
        onHide={() => setShowModal(false)}
        lead={selectedLead}
        onSaved={(msg) => {
          setFeedback({ type: 'success', message: msg });
          fetchLeads();
        }}
      />

      {/* Convert Lead Modal */}
      <ConvertLeadModal
        show={Boolean(convertLead)}
        onHide={() => setConvertLead(null)}
        lead={convertLead}
        onConverted={(msg) => {
          setFeedback({ type: 'success', message: msg });
          fetchLeads();
        }}
      />

      {/* Lead Detail Modal */}
      <LeadDetailModal
        show={Boolean(viewLead)}
        onHide={() => setViewLead(null)}
        lead={viewLead}
        onStatusChange={handleStatusTransition}
        onOpenConvert={(l) => {
          setViewLead(null);
          setConvertLead(l);
        }}
      />
    </div>
  );
};

export default LeadsPage;
