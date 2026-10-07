import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import { BarChart3, Download, FileSpreadsheet } from 'lucide-react';

const ReportsPage = () => {
  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Exportable reports across leads, pipeline, conversions, and team activity."
      >
        <button className="btn btn-crm-secondary d-flex align-items-center gap-2" disabled>
          <Download size={16} /> Export CSV
        </button>
      </PageHeader>

      <div className="crm-card">
        <div className="row g-3 mb-4">
          {['Customer Report', 'Lead Pipeline', 'Conversion Metrics', 'Sales Forecast', 'User Activities', 'Audit Trail'].map((rep) => (
            <div key={rep} className="col-12 col-md-4">
              <div className="p-3 rounded bg-dark border border-secondary border-opacity-10 h-100">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <FileSpreadsheet size={18} className="text-primary" />
                  <div className="fw-semibold text-white small">{rep}</div>
                </div>
                <p className="text-muted small m-0" style={{ fontSize: '0.78rem' }}>
                  Filterable columns, sorting, pagination, and one-click CSV export.
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center py-4 border-top border-secondary border-opacity-10">
          <p className="text-muted small m-0">
            Full report generation engines and export handlers will be connected in Phase 10.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
