import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader';
import AuditLogDetailModal from './AuditLogDetailModal';
import { auditApi } from '../../api/auditApi';
import {
  ShieldAlert,
  Search,
  Filter,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

const AuditLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [actionFilter, setActionFilter] = useState('All');
  const [entityFilter, setEntityFilter] = useState('All');
  const [userEmailSearch, setUserEmailSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchLogs = useCallback(async (targetPage = 1) => {
    setIsLoading(true);
    try {
      const params = { page: targetPage, limit: 20 };
      if (actionFilter !== 'All') params.action = actionFilter;
      if (entityFilter !== 'All') params.entityName = entityFilter;
      if (userEmailSearch.trim()) params.userEmail = userEmailSearch.trim();
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const data = await auditApi.getLogs(params);
      setLogs(data.logs || []);
      setPagination(data.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 });
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [actionFilter, entityFilter, userEmailSearch, startDate, endDate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchLogs]);

  const getActionBadgeClass = (action) => {
    switch (action) {
      case 'LOGIN':
        return 'badge bg-success-subtle text-success border border-success-subtle';
      case 'FAILED_LOGIN':
        return 'badge bg-warning-subtle text-warning border border-warning-subtle';
      case 'LOCKOUT':
        return 'badge bg-danger text-white';
      case 'CREATE':
        return 'badge bg-info-subtle text-info border border-info-subtle';
      case 'UPDATE':
        return 'badge bg-primary-subtle text-primary border border-primary-subtle';
      case 'DELETE':
        return 'badge bg-danger-subtle text-danger border border-danger-subtle';
      case 'STATUS_CHANGE':
        return 'badge bg-purple-subtle text-light border border-secondary';
      case 'LEAD_CONVERTED':
        return 'badge bg-success text-white';
      default:
        return 'badge bg-secondary';
    }
  };

  return (
    <div>
      <PageHeader
        title="Security & Audit Trail"
        subtitle="Append-only immutable record of logins, failed attempts, account lockouts, and entity changes."
      >
        <button
          className="btn btn-crm-secondary d-flex align-items-center gap-2"
          onClick={() => fetchLogs(pagination.page)}
        >
          <RefreshCw size={15} className={isLoading ? 'spin' : ''} /> Refresh Trail
        </button>
      </PageHeader>

      {/* Filter Toolbar */}
      <div className="crm-card mb-4 p-3">
        <div className="row g-2 align-items-center">
          <div className="col-md-3">
            <div className="input-group">
              <span className="input-group-text bg-dark border-secondary text-muted">
                <Search size={15} />
              </span>
              <input
                type="text"
                className="form-control crm-input"
                placeholder="Filter by user email..."
                value={userEmailSearch}
                onChange={(e) => setUserEmailSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="col-md-2">
            <select
              className="form-select crm-input"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <option value="All">All Actions</option>
              <option value="LOGIN">LOGIN</option>
              <option value="FAILED_LOGIN">FAILED_LOGIN</option>
              <option value="LOCKOUT">LOCKOUT</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="STATUS_CHANGE">STATUS_CHANGE</option>
              <option value="ROLE_CHANGE">ROLE_CHANGE</option>
              <option value="PASSWORD_RESET">PASSWORD_RESET</option>
              <option value="LOCKOUT_RESET">LOCKOUT_RESET</option>
              <option value="LEAD_CONVERTED">LEAD_CONVERTED</option>
            </select>
          </div>

          <div className="col-md-2">
            <select
              className="form-select crm-input"
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
            >
              <option value="All">All Entities</option>
              <option value="AUTH">AUTH</option>
              <option value="USER">USER</option>
              <option value="CUSTOMER">CUSTOMER</option>
              <option value="LEAD">LEAD</option>
              <option value="OPPORTUNITY">OPPORTUNITY</option>
              <option value="FOLLOWUP">FOLLOWUP</option>
            </select>
          </div>

          <div className="col-md-2">
            <input
              type="date"
              className="form-control crm-input"
              placeholder="From Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="col-md-2">
            <input
              type="date"
              className="form-control crm-input"
              placeholder="To Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="col-md-1 text-end">
            {(startDate || endDate || actionFilter !== 'All' || entityFilter !== 'All' || userEmailSearch) && (
              <button
                className="btn btn-sm btn-link text-muted p-0"
                onClick={() => {
                  setActionFilter('All');
                  setEntityFilter('All');
                  setUserEmailSearch('');
                  setStartDate('');
                  setEndDate('');
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="crm-card p-0 overflow-hidden mb-4">
        <div className="table-responsive">
          <table className="table table-dark table-hover crm-table align-middle mb-0">
            <thead>
              <tr>
                <th className="ps-3">Timestamp</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Target ID</th>
                <th>IP Address</th>
                <th className="text-end pe-3">Inspection</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                    Loading immutable audit logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    No audit records matching query filters.
                  </td>
                </tr>
              ) : (
                logs.map((item) => (
                  <tr key={item._id}>
                    <td className="ps-3">
                      <div className="text-white small fw-medium">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {new Date(item.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td>
                      <div className="text-white small fw-medium">
                        {item.userId?.name || item.userEmail || 'Anonymous'}
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {item.userId?.email || item.userEmail || 'N/A'}
                      </div>
                    </td>
                    <td>
                      <span className={getActionBadgeClass(item.action)}>{item.action}</span>
                    </td>
                    <td>
                      <span className="badge bg-secondary" style={{ fontSize: '0.72rem' }}>
                        {item.entityName}
                      </span>
                    </td>
                    <td className="text-muted small">
                      {item.recordId ? (
                        <span className="font-monospace" style={{ fontSize: '0.8rem' }}>
                          #{item.recordId.slice(-6)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="text-muted small font-monospace" style={{ fontSize: '0.8rem' }}>
                      {item.ipAddress || 'Internal'}
                    </td>
                    <td className="text-end pe-3">
                      <button
                        className="btn btn-sm btn-crm-secondary p-1 px-2 text-info"
                        title="Inspect Diff"
                        onClick={() => {
                          setSelectedLog(item);
                          setShowDetailModal(true);
                        }}
                      >
                        <Eye size={14} className="me-1" /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="d-flex align-items-center justify-content-between p-3 border-top border-dark">
            <span className="text-muted small">
              Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} total events)
            </span>
            <div className="d-flex gap-2">
              <button
                className="btn btn-sm btn-crm-secondary d-flex align-items-center gap-1"
                disabled={pagination.page <= 1}
                onClick={() => fetchLogs(pagination.page - 1)}
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <button
                className="btn btn-sm btn-crm-secondary d-flex align-items-center gap-1"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchLogs(pagination.page + 1)}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Diff Modal */}
      <AuditLogDetailModal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        log={selectedLog}
      />
    </div>
  );
};

export default AuditLogPage;
