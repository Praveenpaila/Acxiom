import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader';
import OpportunityModal from './OpportunityModal';
import { opportunityApi } from '../../api/opportunityApi';
import { formatCurrency, formatCompactCurrency } from '../../utils/formatters';
import {
  TrendingUp,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Building2,
  IndianRupee,
  Award,
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const OpportunitiesPage = () => {
  const [opps, setOpps] = useState([]);
  const [pipelineStats, setPipelineStats] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('All');

  const [showModal, setShowModal] = useState(false);
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const fetchOpps = useCallback(async () => {
    try {
      setLoading(true);
      const [listRes, statsRes] = await Promise.all([
        opportunityApi.getOpportunities({
          page: pagination.page,
          limit: pagination.limit,
          search,
          stage: stageFilter,
        }),
        opportunityApi.getPipelineStats(),
      ]);

      if (listRes.success) {
        setOpps(listRes.opportunities);
        setPagination(listRes.pagination);
      }

      if (statsRes.success) {
        setPipelineStats(statsRes.stats);
      }
    } catch (err) {
      setFeedback({ type: 'danger', message: err.customMessage || 'Failed to load opportunities.' });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, stageFilter]);

  useEffect(() => {
    fetchOpps();
  }, [fetchOpps]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleStageChange = (e) => {
    setStageFilter(e.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleCreate = () => {
    setSelectedOpp(null);
    setShowModal(true);
  };

  const handleEdit = (opp) => {
    setSelectedOpp(opp);
    setShowModal(true);
  };

  const handleDelete = async (opp) => {
    const isConfirm = window.confirm(`Delete opportunity "${opp.name}"?`);
    if (!isConfirm) return;

    try {
      const res = await opportunityApi.deleteOpportunity(opp.id);
      setFeedback({ type: 'success', message: res.message || 'Deleted successfully.' });
      fetchOpps();
    } catch (err) {
      setFeedback({ type: 'danger', message: err.customMessage || 'Failed to delete opportunity.' });
    }
  };

  const getStageBadge = (stage) => {
    switch (stage) {
      case 'Qualification':
        return 'bg-secondary bg-opacity-25 text-secondary';
      case 'Proposal':
        return 'bg-info bg-opacity-25 text-info';
      case 'Negotiation':
        return 'bg-warning bg-opacity-25 text-warning';
      case 'Won':
        return 'bg-success bg-opacity-25 text-success';
      case 'Lost':
        return 'bg-danger bg-opacity-25 text-danger';
      default:
        return 'bg-secondary';
    }
  };

  return (
    <div>
      <PageHeader
        title="Sales Opportunities"
        subtitle="Manage deal stages, probability ratings, and weighted pipeline forecasting."
      >
        <button onClick={handleCreate} className="btn btn-crm-primary d-flex align-items-center gap-2">
          <Plus size={16} /> New Opportunity
        </button>
      </PageHeader>

      {/* Pipeline Summary Cards */}
      {pipelineStats && (
        <div className="row g-3 mb-4">
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="crm-card metric-card accent-indigo p-3">
              <div className="text-muted small fw-semibold">TOTAL PIPELINE</div>
              <div className="fs-4 fw-bold text-white mt-1">
                {formatCompactCurrency(pipelineStats.totalPipelineValue)}
              </div>
              <div className="text-muted small mt-1">
                {pipelineStats.totalOpportunities} Total Deals
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="crm-card metric-card accent-green p-3">
              <div className="text-muted small fw-semibold">WEIGHTED FORECAST</div>
              <div className="fs-4 fw-bold text-success mt-1">
                {formatCompactCurrency(pipelineStats.weightedPipelineValue)}
              </div>
              <div className="text-muted small mt-1">
                Weighted by win probability
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="crm-card metric-card accent-green p-3">
              <div className="text-muted small fw-semibold">WON REVENUE</div>
              <div className="fs-4 fw-bold text-white mt-1">
                {formatCompactCurrency(pipelineStats.wonAmount)}
              </div>
              <div className="text-muted small mt-1">
                {pipelineStats.wonCount} Deals Closed
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="crm-card metric-card accent-amber p-3">
              <div className="text-muted small fw-semibold">OPEN DEALS</div>
              <div className="fs-4 fw-bold text-warning mt-1">
                {pipelineStats.openCount}
              </div>
              <div className="text-muted small mt-1">
                {pipelineStats.lostCount} Lost Deals
              </div>
            </div>
          </div>
        </div>
      )}

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
                placeholder="Search deals by name..."
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
                value={stageFilter}
                onChange={handleStageChange}
              >
                <option value="All">All Stages</option>
                <option value="Qualification">Qualification</option>
                <option value="Proposal">Proposal</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Won">Won</option>
                <option value="Lost">Lost</option>
              </select>
            </div>
          </div>

          <div className="col-6 col-md-3 col-lg-4 d-flex justify-content-end gap-2">
            <button onClick={fetchOpps} className="btn btn-crm-secondary d-flex align-items-center gap-2" title="Refresh">
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              <span className="d-none d-sm-inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Opportunities Data Table */}
      <div className="crm-card p-0 overflow-hidden">
        {loading && opps.length === 0 ? (
          <LoadingSpinner message="Fetching deals..." />
        ) : opps.length === 0 ? (
          <div className="text-center py-5">
            <div className="brand-icon-box mx-auto mb-3" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8' }}>
              <TrendingUp size={24} />
            </div>
            <h5 className="text-white mb-1">No Opportunities Found</h5>
            <p className="text-muted small mx-auto" style={{ maxWidth: '360px' }}>
              Create your first sales deal to begin tracking pipeline metrics.
            </p>
            <button onClick={handleCreate} className="btn btn-crm-primary btn-sm mt-2">
              <Plus size={15} /> Create Opportunity
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Deal Name</th>
                  <th>Customer Account</th>
                  <th>Deal Amount</th>
                  <th>Win Prob</th>
                  <th>Weighted Value</th>
                  <th>Stage</th>
                  <th>Close Date</th>
                  <th>Assigned To</th>
                  <th className="text-end" style={{ width: '110px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {opps.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <div className="fw-semibold text-white">{o.name}</div>
                      {o.notes && (
                        <div className="text-muted small text-truncate" style={{ maxWidth: '240px', fontSize: '0.75rem' }}>
                          {o.notes}
                        </div>
                      )}
                    </td>

                    <td>
                      <div className="small text-white">
                        {o.customerId?.company || 'Unlinked'}
                      </div>
                      {o.customerId?.customerCode && (
                        <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
                          {o.customerId.customerCode}
                        </div>
                      )}
                    </td>

                    <td>
                      <span className="fw-bold text-white">
                        {formatCurrency(o.amount)}
                      </span>
                    </td>

                    <td>
                      <span className="badge bg-dark border border-secondary border-opacity-25 text-white">
                        {o.probability}%
                      </span>
                    </td>

                    <td>
                      <span className="fw-semibold text-success">
                        {formatCurrency(o.weightedAmount)}
                      </span>
                    </td>

                    <td>
                      <span className={`badge ${getStageBadge(o.stage)}`} style={{ fontSize: '0.75rem' }}>
                        {o.stage}
                      </span>
                    </td>

                    <td>
                      <span className="small text-secondary">
                        {new Date(o.expectedCloseDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </td>

                    <td>
                      <div className="small text-white">{o.assignedTo?.name || 'Admin'}</div>
                    </td>

                    <td className="text-end">
                      <div className="d-flex align-items-center justify-content-end gap-1">
                        <button
                          onClick={() => handleEdit(o)}
                          className="btn btn-sm btn-outline-primary p-1"
                          title="Edit Deal"
                          style={{ width: '30px', height: '30px', borderRadius: '7px' }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(o)}
                          className="btn btn-sm btn-outline-danger p-1"
                          title="Delete Deal"
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
              of <span className="text-white fw-semibold">{pagination.total}</span> deals
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

      <OpportunityModal
        show={showModal}
        onHide={() => setShowModal(false)}
        opportunity={selectedOpp}
        onSaved={(msg) => {
          setFeedback({ type: 'success', message: msg });
          fetchOpps();
        }}
      />
    </div>
  );
};

export default OpportunitiesPage;
