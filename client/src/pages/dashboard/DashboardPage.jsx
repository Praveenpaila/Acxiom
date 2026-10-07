import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import {
  Users,
  UserCheck,
  TrendingUp,
  Award,
  AlertTriangle,
  IndianRupee,
  CalendarCheck,
  Target,
  ArrowUpRight,
} from 'lucide-react';
import { formatCompactCurrency, getRoleBadgeClass } from '../../utils/formatters';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

const DashboardPage = () => {
  const { user } = useAuth();

  // Initial mockup metrics for Dashboard Shell
  const metrics = [
    {
      title: 'Total Customers',
      value: '48',
      subtext: '+4 new this month',
      icon: Users,
      variant: 'indigo',
    },
    {
      title: 'Total Leads',
      value: '134',
      subtext: 'Across all channels',
      icon: UserCheck,
      variant: 'sky',
    },
    {
      title: 'Open Leads',
      value: '52',
      subtext: 'Awaiting qualification',
      icon: Target,
      variant: 'amber',
    },
    {
      title: 'Pipeline Value',
      value: formatCompactCurrency(3850000),
      subtext: 'Weighted forecast',
      icon: IndianRupee,
      variant: 'purple',
    },
    {
      title: 'Total Opportunities',
      value: '26',
      subtext: 'Active deal cycle',
      icon: TrendingUp,
      variant: 'indigo',
    },
    {
      title: 'Deals Won',
      value: '14',
      subtext: '₹24.8 L closed revenue',
      icon: Award,
      variant: 'green',
    },
    {
      title: 'Deals Lost',
      value: '5',
      subtext: 'Win rate: 73.6%',
      icon: AlertTriangle,
      variant: 'rose',
    },
    {
      title: 'Pending Follow-Ups',
      value: '9',
      subtext: '2 overdue today',
      icon: CalendarCheck,
      variant: 'amber',
    },
  ];

  // Lead status doughnut chart data
  const leadStatusData = {
    labels: ['New', 'Contacted', 'Qualified', 'Unqualified'],
    datasets: [
      {
        data: [28, 42, 35, 12],
        backgroundColor: ['#6366f1', '#0ea5e9', '#10b981', '#64748b'],
        borderWidth: 0,
      },
    ],
  };

  // Opportunity pipeline stages bar chart data
  const pipelineData = {
    labels: ['Qualification', 'Proposal', 'Negotiation', 'Won'],
    datasets: [
      {
        label: 'Deal Value (₹ in Lakhs)',
        data: [8.5, 14.2, 11.0, 24.8],
        backgroundColor: '#4f46e5',
        borderRadius: 6,
      },
    ],
  };

  // Monthly revenue trend line chart data
  const revenueTrendData = {
    labels: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
    datasets: [
      {
        label: 'Sales Revenue (₹ Lakhs)',
        data: [4.2, 6.8, 8.5, 12.1, 18.4, 24.8],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#10b981',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#94a3b8',
          font: { family: 'Inter', size: 12 },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#64748b' },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      y: {
        ticks: { color: '#64748b' },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#94a3b8',
          boxWidth: 12,
          padding: 15,
          font: { family: 'Inter', size: 12 },
        },
      },
    },
    cutout: '72%',
  };

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.name}`}
        subtitle={`Scope: ${user?.role} view • Showing real-time pipeline and sales analytics.`}
      >
        <span className={getRoleBadgeClass(user?.role)}>{user?.role}</span>
      </PageHeader>

      {/* Metric Cards Grid */}
      <div className="row g-3 mb-4">
        {metrics.map((m, idx) => (
          <div key={idx} className="col-12 col-sm-6 col-xl-3">
            <StatCard
              title={m.title}
              value={m.value}
              subtext={m.subtext}
              icon={m.icon}
              variant={m.variant}
            />
          </div>
        ))}
      </div>

      {/* Analytics Charts Row */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-4">
          <div className="crm-card h-100">
            <h5 className="fw-semibold mb-1">Lead Breakdown</h5>
            <p className="text-muted small mb-3">Distribution by conversion stage</p>
            <div style={{ height: '240px' }}>
              <Doughnut data={leadStatusData} options={doughnutOptions} />
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-8">
          <div className="crm-card h-100">
            <h5 className="fw-semibold mb-1">Deal Pipeline Stages</h5>
            <p className="text-muted small mb-3">Weighted deal value across sales cycle</p>
            <div style={{ height: '240px' }}>
              <Bar data={pipelineData} options={chartOptions} />
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Trend & Quick Activities Row */}
      <div className="row g-3">
        <div className="col-12 col-lg-7">
          <div className="crm-card h-100">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div>
                <h5 className="fw-semibold mb-1">Sales Revenue Performance</h5>
                <p className="text-muted small m-0">Monthly closed deals trajectory</p>
              </div>
              <div className="badge bg-success bg-opacity-25 text-success d-flex align-items-center gap-1">
                <ArrowUpRight size={14} /> +34.8% YoY
              </div>
            </div>
            <div style={{ height: '220px' }}>
              <Line data={revenueTrendData} options={chartOptions} />
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-5">
          <div className="crm-card h-100">
            <h5 className="fw-semibold mb-1">Upcoming Follow-Ups</h5>
            <p className="text-muted small mb-3">High priority scheduled touchpoints</p>
            <div className="d-flex flex-column gap-2">
              <div className="p-2 rounded bg-dark border border-secondary border-opacity-10 d-flex align-items-center justify-content-between">
                <div>
                  <div className="fw-semibold small text-white">Tata Consultancy Deal Review</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                    Meeting with Amit Roy • Today, 3:30 PM
                  </div>
                </div>
                <span className="badge bg-warning bg-opacity-25 text-warning small">Pending</span>
              </div>

              <div className="p-2 rounded bg-dark border border-secondary border-opacity-10 d-flex align-items-center justify-content-between">
                <div>
                  <div className="fw-semibold small text-white">Infosys Proposal Follow-Up</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                    Call with Sneha Patel • Tomorrow, 11:00 AM
                  </div>
                </div>
                <span className="badge bg-info bg-opacity-25 text-info small">Call</span>
              </div>

              <div className="p-2 rounded bg-dark border border-secondary border-opacity-10 d-flex align-items-center justify-content-between">
                <div>
                  <div className="fw-semibold small text-white">Reliance Retail Contract</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                    Contract send-off • Friday, 4:00 PM
                  </div>
                </div>
                <span className="badge bg-primary bg-opacity-25 text-primary small">Task</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
