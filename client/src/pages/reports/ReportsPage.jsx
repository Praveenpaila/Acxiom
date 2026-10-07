import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader';
import { reportApi } from '../../api/reportApi';
import {
  BarChart3,
  Download,
  Building2,
  UserCheck,
  TrendingUp,
  CalendarCheck,
  Search,
  RefreshCw,
  FileSpreadsheet,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const REPORT_TABS = [
  { id: 'customers', label: 'Customers Report', icon: Building2 },
  { id: 'leads', label: 'Leads & Funnel', icon: UserCheck },
  { id: 'opportunities', label: 'Deals & Revenue', icon: TrendingUp },
  { id: 'followups', label: 'Activities & Follow-Ups', icon: CalendarCheck },
];

const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState('customers');
  const [columns, setColumns] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [search, setSearch] = useState('');

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await reportApi.getReport(activeTab);
      setColumns(res.columns || []);
      setReportData(res.data || []);
    } catch (err) {
      console.error('Failed to load report data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      await reportApi.downloadCsv(activeTab);
    } catch (err) {
      console.error('Failed to export CSV:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Filter rows locally if search is typed
  const filteredData = reportData.filter((row) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return Object.values(row).some((val) => {
      if (!val) return false;
      if (typeof val === 'object') {
        return Object.values(val).some((v) => String(v).toLowerCase().includes(s));
      }
      return String(val).toLowerCase().includes(s);
    });
  });

  const renderCellContent = (col, row) => {
    let val;
    if (col.accessor) {
      val = col.accessor(row);
    } else {
      val = row[col.key];
    }

    if (val === null || val === undefined) return '—';

    // Format currency amounts
    if (col.key === 'amount' || col.key === 'expectedValue' || col.key === 'weightedAmount') {
      return <span className="font-monospace text-success">{formatCurrency(val)}</span>;
    }

    // Format dates
    if (col.key === 'createdAt' || col.key === 'dueDate' || col.key === 'expectedCloseDate' || col.key === 'completedAt') {
      return val ? new Date(val).toLocaleDateString() : '—';
    }

    // Format status badges
    if (col.key === 'status') {
      const isGood = ['Active', 'Won', 'Completed', 'Qualified'].includes(val);
      const isWarn = ['Pending', 'Contacted', 'New'].includes(val);
      const badgeCls = isGood
        ? 'bg-success-subtle text-success border border-success-subtle'
        : isWarn
        ? 'bg-warning-subtle text-warning border border-warning-subtle'
        : 'bg-secondary';

      return <span className={`badge ${badgeCls}`}>{val}</span>;
    }

    return String(val);
  };

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Role-scoped intelligence, granular operational tables, and instantaneous CSV data exports."
      >
        <button
          className="btn btn-crm-primary d-flex align-items-center gap-2"
          onClick={handleExportCsv}
          disabled={isExporting || isLoading}
        >
          <Download size={16} />
          {isExporting ? 'Generating CSV...' : 'Export Current Report (.csv)'}
        </button>
      </PageHeader>

      {/* Report Tabs */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        {REPORT_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`btn ${isActive ? 'btn-crm-primary' : 'btn-crm-secondary'} d-flex align-items-center gap-2`}
              onClick={() => {
                setActiveTab(tab.id);
                setSearch('');
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="crm-card mb-4 p-3">
        <div className="row g-2 align-items-center">
          <div className="col-md-6">
            <div className="input-group">
              <span className="input-group-text bg-dark border-secondary text-muted">
                <Search size={15} />
              </span>
              <input
                type="text"
                className="form-control crm-input"
                placeholder="Search across all columns in this report..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="col-md-6 d-flex align-items-center justify-content-end gap-3">
            <span className="text-muted small">
              Showing <strong>{filteredData.length}</strong> of {reportData.length} records
            </span>
            <button
              className="btn btn-crm-secondary p-2"
              title="Refresh Report"
              onClick={fetchReport}
            >
              <RefreshCw size={15} className={isLoading ? 'spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Report Data Table */}
      <div className="crm-card p-0 overflow-hidden mb-4">
        <div className="table-responsive">
          <table className="table table-dark table-hover crm-table align-middle mb-0">
            <thead>
              <tr>
                {columns.map((c, i) => (
                  <th key={c.key || i} className={i === 0 ? 'ps-3' : ''}>
                    {c.label || c.key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length || 1} className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                    Compiling report data...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length || 1} className="text-center py-5 text-muted">
                    No data records matching active criteria.
                  </td>
                </tr>
              ) : (
                filteredData.map((row, idx) => (
                  <tr key={row._id || row.id || idx}>
                    {columns.map((c, i) => (
                      <td key={c.key || i} className={i === 0 ? 'ps-3' : ''}>
                        {renderCellContent(c, row)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
