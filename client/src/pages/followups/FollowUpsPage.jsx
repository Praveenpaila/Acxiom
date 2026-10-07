import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader';
import FollowUpModal from './FollowUpModal';
import CompleteModal from './CompleteModal';
import RescheduleModal from './RescheduleModal';
import { followUpApi } from '../../api/followUpApi';
import { formatDate } from '../../utils/formatters';
import {
  CalendarCheck,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Trash2,
  Phone,
  Users,
  Mail,
  CheckSquare,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const FollowUpsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewFilter, setViewFilter] = useState('pending'); // 'pending', 'overdue', 'completed', 'all'
  const [typeFilter, setTypeFilter] = useState('All');

  // Modals state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [completeTarget, setCompleteTarget] = useState(null);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);

  const [feedback, setFeedback] = useState(null);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const data = await followUpApi.getFollowUps({
        view: viewFilter,
        type: typeFilter,
      });

      if (data.success) {
        setItems(data.followUps);
      }
    } catch (err) {
      setFeedback({ type: 'danger', message: err.customMessage || 'Failed to load follow-ups.' });
    } finally {
      setLoading(false);
    }
  }, [viewFilter, typeFilter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete activity "${title}"?`)) return;
    try {
      const res = await followUpApi.deleteFollowUp(id);
      setFeedback({ type: 'success', message: res.message || 'Deleted successfully.' });
      fetchItems();
    } catch (err) {
      setFeedback({ type: 'danger', message: err.customMessage || 'Failed to delete.' });
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Call':
        return <Phone size={14} className="text-warning" />;
      case 'Meeting':
        return <Users size={14} className="text-primary" />;
      case 'Email':
        return <Mail size={14} className="text-info" />;
      case 'Task':
        return <CheckSquare size={14} className="text-success" />;
      default:
        return <CalendarCheck size={14} />;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-danger bg-opacity-25 text-danger';
      case 'High':
        return 'bg-warning bg-opacity-25 text-warning';
      case 'Medium':
        return 'bg-primary bg-opacity-25 text-primary';
      case 'Low':
        return 'bg-secondary bg-opacity-25 text-secondary';
      default:
        return 'bg-secondary';
    }
  };

  return (
    <div>
      <PageHeader
        title="Follow-Ups & Activities"
        subtitle="Schedule, reschedule, complete, and review pending or overdue sales touchpoints."
      >
        <button
          onClick={() => setShowScheduleModal(true)}
          className="btn btn-crm-primary d-flex align-items-center gap-2"
        >
          <Plus size={16} /> Schedule Activity
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

      {/* View Tabs & Type Filters */}
      <div className="crm-card mb-4">
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
          {/* View Pill Tabs */}
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <button
              onClick={() => setViewFilter('pending')}
              className={`btn btn-sm ${viewFilter === 'pending' ? 'btn-crm-primary' : 'btn-crm-secondary'}`}
            >
              Pending Activities
            </button>
            <button
              onClick={() => setViewFilter('overdue')}
              className={`btn btn-sm ${viewFilter === 'overdue' ? 'btn-danger' : 'btn-crm-secondary'}`}
            >
              Overdue Touchpoints
            </button>
            <button
              onClick={() => setViewFilter('completed')}
              className={`btn btn-sm ${viewFilter === 'completed' ? 'btn-success' : 'btn-crm-secondary'}`}
            >
              Completed History
            </button>
            <button
              onClick={() => setViewFilter('all')}
              className={`btn btn-sm ${viewFilter === 'all' ? 'btn-crm-primary' : 'btn-crm-secondary'}`}
            >
              All Activities
            </button>
          </div>

          {/* Type Select & Refresh */}
          <div className="d-flex align-items-center gap-2">
            <div className="input-group input-group-sm" style={{ width: '150px' }}>
              <span className="input-group-text bg-dark border-secondary border-opacity-25 text-muted">
                <Filter size={13} />
              </span>
              <select
                className="form-select crm-input"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="All">All Types</option>
                <option value="Call">Calls</option>
                <option value="Meeting">Meetings</option>
                <option value="Email">Emails</option>
                <option value="Task">Tasks</option>
              </select>
            </div>

            <button onClick={fetchItems} className="btn btn-sm btn-crm-secondary" title="Refresh">
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Activities Table */}
      <div className="crm-card p-0 overflow-hidden">
        {loading && items.length === 0 ? (
          <LoadingSpinner message="Fetching sales activities..." />
        ) : items.length === 0 ? (
          <div className="text-center py-5">
            <div className="brand-icon-box mx-auto mb-3" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24' }}>
              <Clock size={24} />
            </div>
            <h5 className="text-white mb-1">No Activities Found</h5>
            <p className="text-muted small mx-auto" style={{ maxWidth: '360px' }}>
              No scheduled activities matching the selected filter.
            </p>
            <button onClick={() => setShowScheduleModal(true)} className="btn btn-crm-primary btn-sm mt-2">
              <Plus size={15} /> Schedule Activity
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="crm-table">
              <thead>
                <tr>
                  <th style={{ width: '100px' }}>Type</th>
                  <th>Activity / Subject</th>
                  <th>Related Record</th>
                  <th>Scheduled Date</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th className="text-end" style={{ width: '160px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id}>
                    <td>
                      <div className="d-flex align-items-center gap-1 small fw-semibold text-white">
                        {getTypeIcon(it.type)}
                        <span>{it.type}</span>
                      </div>
                    </td>

                    <td>
                      <div className="fw-semibold text-white">{it.title}</div>
                      {it.description && (
                        <div className="text-muted small text-truncate" style={{ maxWidth: '280px', fontSize: '0.78rem' }}>
                          {it.description}
                        </div>
                      )}
                      {it.completedNotes && (
                        <div className="text-success small mt-1" style={{ fontSize: '0.75rem' }}>
                          ✓ Outcome: {it.completedNotes}
                        </div>
                      )}
                    </td>

                    <td>
                      {it.customerId ? (
                        <div className="small">
                          <span className="text-muted">Customer:</span>{' '}
                          <strong className="text-white">{it.customerId.company}</strong>
                        </div>
                      ) : it.leadId ? (
                        <div className="small">
                          <span className="text-muted">Lead:</span>{' '}
                          <strong className="text-white">{it.leadId.company}</strong>
                        </div>
                      ) : (
                        <span className="text-muted small">—</span>
                      )}
                    </td>

                    <td>
                      <div className="small text-white">{formatDate(it.dueDate)}</div>
                      {it.isOverdue && (
                        <span className="badge bg-danger bg-opacity-25 text-danger d-inline-flex align-items-center gap-1 mt-1" style={{ fontSize: '0.68rem' }}>
                          <AlertTriangle size={11} /> Overdue
                        </span>
                      )}
                    </td>

                    <td>
                      <span className={`badge ${getPriorityBadge(it.priority)}`} style={{ fontSize: '0.72rem' }}>
                        {it.priority}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`badge ${it.status === 'Completed' ? 'bg-success bg-opacity-25 text-success' : it.status === 'Pending' ? 'bg-warning bg-opacity-25 text-warning' : 'bg-secondary bg-opacity-25 text-secondary'}`}
                        style={{ fontSize: '0.72rem' }}
                      >
                        {it.status}
                      </span>
                    </td>

                    <td>
                      <div className="small text-white">{it.assignedTo?.name || 'Unassigned'}</div>
                    </td>

                    <td className="text-end">
                      <div className="d-flex align-items-center justify-content-end gap-1">
                        {it.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => setCompleteTarget(it)}
                              className="btn btn-sm btn-outline-success p-1"
                              title="Mark Complete"
                              style={{ width: '30px', height: '30px', borderRadius: '7px' }}
                            >
                              <CheckCircle2 size={14} />
                            </button>
                            <button
                              onClick={() => setRescheduleTarget(it)}
                              className="btn btn-sm btn-outline-warning p-1"
                              title="Reschedule"
                              style={{ width: '30px', height: '30px', borderRadius: '7px' }}
                            >
                              <Calendar size={14} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(it.id, it.title)}
                          className="btn btn-sm btn-outline-danger p-1"
                          title="Delete Activity"
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
      </div>

      {/* Modals */}
      <FollowUpModal
        show={showScheduleModal}
        onHide={() => setShowScheduleModal(false)}
        onSaved={(msg) => {
          setFeedback({ type: 'success', message: msg });
          fetchItems();
        }}
      />

      <CompleteModal
        show={Boolean(completeTarget)}
        onHide={() => setCompleteTarget(null)}
        followUp={completeTarget}
        onCompleted={(msg) => {
          setFeedback({ type: 'success', message: msg });
          fetchItems();
        }}
      />

      <RescheduleModal
        show={Boolean(rescheduleTarget)}
        onHide={() => setRescheduleTarget(null)}
        followUp={rescheduleTarget}
        onRescheduled={(msg) => {
          setFeedback({ type: 'success', message: msg });
          fetchItems();
        }}
      />
    </div>
  );
};

export default FollowUpsPage;
