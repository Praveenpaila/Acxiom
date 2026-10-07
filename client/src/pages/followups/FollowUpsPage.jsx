import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import { CalendarCheck, Plus, CheckCircle2, Clock } from 'lucide-react';

const FollowUpsPage = () => {
  return (
    <div>
      <PageHeader
        title="Follow-Ups & Activities"
        subtitle="Manage scheduled calls, meetings, tasks, and overdue actions."
      >
        <button className="btn btn-crm-primary d-flex align-items-center gap-2">
          <Plus size={16} /> Schedule Follow-Up
        </button>
      </PageHeader>

      <div className="crm-card">
        <div className="d-flex align-items-center gap-3 border-bottom border-secondary border-opacity-10 pb-3 mb-4">
          <button className="btn btn-sm btn-crm-primary">Pending & Overdue</button>
          <button className="btn btn-sm btn-crm-secondary">Completed</button>
          <button className="btn btn-sm btn-crm-secondary">Activity History</button>
        </div>

        <div className="text-center py-5">
          <div className="brand-icon-box mx-auto mb-3" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24' }}>
            <Clock size={24} />
          </div>
          <h5 className="text-white mb-1">Follow-Up Workflow Shell Ready</h5>
          <p className="text-muted small mx-auto" style={{ maxWidth: '400px' }}>
            Schedule, reschedule, complete, and track calls, meetings, emails, and tasks in Phase 5.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FollowUpsPage;
