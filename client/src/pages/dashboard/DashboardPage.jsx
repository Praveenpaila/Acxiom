import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { reportApi } from '../../api/reportApi';
import {
  Users,
  UserCheck,
  TrendingUp,
  Award,
  AlertTriangle,
  IndianRupee,
  CalendarCheck,
  Target,
  RefreshCw,
  Trophy,
} from 'lucide-react';
import { formatCompactCurrency, formatCurrency, getRoleBadgeClass } from '../../utils/formatters';
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
import { Doughnut, Bar } from 'react-chartjs-2';

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
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await reportApi.getDashboardStats();
      setData(res.stats);
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const kpis = data?.kpis || {
    totalCustomers: 0,
    totalLeads: 0,
    openLeads: 0,
    convertedLeads: 0,
    conversionRate: 0,
    totalOpportunities: 0,
    openDealsCount: 0,
    wonDealsCount: 0,
    wonDealsAmount: 0,
    totalPipelineValue: 0,
    weightedPipelineValue: 0,
    pendingFollowUps: 0,
    overdueFollowUps: 0,
    completedFollowUps: 0,
  };

  const metrics = [
    {
      title: 'Total Customers',
      value: kpis.totalCustomers.toString(),
      subtext: 'Active client accounts',
      icon: Users,
      variant: 'indigo',
    },
    {
      title: 'Total Leads',
      value: kpis.totalLeads.toString(),
      subtext: `${kpis.conversionRate}% conversion rate`,
      icon: UserCheck,
      variant: 'sky',
    },
    {
      title: 'Active Pipeline',
      value: formatCompactCurrency(kpis.totalPipelineValue),
      subtext: `Weighted: ${formatCompactCurrency(kpis.weightedPipelineValue)}`,
      icon: IndianRupee,
      variant: 'purple',
    },
    {
      title: 'Deals Won',
      value: kpis.wonDealsCount.toString(),
      subtext: `${formatCompactCurrency(kpis.wonDealsAmount)} closed revenue`,
      icon: Award,
      variant: 'green',
    },
    {
      title: 'Open Deals',
      value: kpis.openDealsCount.toString(),
      subtext: `${kpis.totalOpportunities} total opportunities`,
      icon: TrendingUp,
      variant: 'amber',
    },
    {
      title: 'Open Leads',
      value: kpis.openLeads.toString(),
      subtext: `${kpis.convertedLeads} converted`,
      icon: Target,
      variant: 'sky',
    },
    {
      title: 'Pending Follow-Ups',
      value: kpis.pendingFollowUps.toString(),
      subtext: `${kpis.overdueFollowUps} overdue activities`,
      icon: CalendarCheck,
      variant: kpis.overdueFollowUps > 0 ? 'rose' : 'amber',
    },
    {
      title: 'Completed Activities',
      value: kpis.completedFollowUps.toString(),
      subtext: 'Touchpoints logged',
      icon: Award,
      variant: 'green',
    },
  ];

  // Lead status doughnut chart
  const leadsByStatus = data?.charts?.leadsByStatus || {
    New: 0,
    Contacted: 0,
    Qualified: 0,
    Unqualified: 0,
    Converted: 0,
  };

  const leadStatusChartData = {
    labels: Object.keys(leadsByStatus),
    datasets: [
      {
        data: Object.values(leadsByStatus),
        backgroundColor: ['#6366f1', '#0ea5e9', '#10b981', '#64748b', '#8b5cf6'],
        borderWidth: 0,
      },
    ],
  };

  // Pipeline stage bar chart
  const pipelineByStage = data?.charts?.pipelineByStage || {
    Qualification: { count: 0, amount: 0 },
    Proposal: { count: 0, amount: 0 },
    Negotiation: { count: 0, amount: 0 },
    Won: { count: 0, amount: 0 },
    Lost: { count: 0, amount: 0 },
  };

  const pipelineStages = Object.keys(pipelineByStage);
  const pipelineAmounts = pipelineStages.map((s) => Math.round((pipelineByStage[s]?.amount || 0) / 100000)); // In Lakhs

  const pipelineChartData = {
    labels: pipelineStages,
    datasets: [
      {
        label: 'Deal Value (₹ Lakhs)',
        data: pipelineAmounts,
        backgroundColor: ['#6366f1', '#0ea5e9', '#f59e0b', '#10b981', '#f43f5e'],
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      y: {
        ticks: { color: '#94a3b8' },
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
          padding: 12,
          font: { family: 'Inter', size: 11 },
        },
      },
    },
    cutout: '70%',
  };

  const team = data?.teamPerformance || [];

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.name}`}
        subtitle={`Scope: ${user?.role} view • Real-time pipeline, conversion rates, and activities.`}
      >
        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-crm-secondary p-2 d-flex align-items-center gap-1"
            title="Refresh Metrics"
            onClick={fetchStats}
          >
            <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
          </button>
          <span className={getRoleBadgeClass(user?.role)}>{user?.role}</span>
        </div>
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
        <div className="col-12 col-lg-5">
          <div className="crm-card h-100">
            <h5 className="fw-semibold mb-1 text-white">Lead Funnel Distribution</h5>
            <p className="text-muted small mb-3">Live status breakdown across CRM leads</p>
            <div style={{ height: '240px' }}>
              <Doughnut data={leadStatusChartData} options={doughnutOptions} />
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-7">
          <div className="crm-card h-100">
            <h5 className="fw-semibold mb-1 text-white">Revenue Pipeline by Stage</h5>
            <p className="text-muted small mb-3">Aggregated opportunity value (₹ in Lakhs)</p>
            <div style={{ height: '240px' }}>
              <Bar data={pipelineChartData} options={chartOptions} />
            </div>
          </div>
        </div>
      </div>

      {/* Team Leaderboard / Performance for Manager and Admin */}
      {team.length > 0 && (
        <div className="crm-card mb-4 p-0 overflow-hidden">
          <div className="p-3 border-bottom border-dark d-flex align-items-center gap-2">
            <Trophy size={18} className="text-warning" />
            <h6 className="fw-semibold text-white mb-0">Sales Team Leaderboard & Velocity</h6>
          </div>
          <div className="table-responsive">
            <table className="table table-dark table-hover crm-table align-middle mb-0">
              <thead>
                <tr>
                  <th className="ps-3">Executive</th>
                  <th>Role</th>
                  <th>Leads Managed</th>
                  <th>Open Opportunities</th>
                  <th>Deals Won</th>
                  <th className="text-end pe-3">Won Revenue</th>
                </tr>
              </thead>
              <tbody>
                {team.map((member, i) => (
                  <tr key={member.id || i}>
                    <td className="ps-3">
                      <div className="fw-semibold text-white">{member.name}</div>
                      <div className="text-muted small">{member.email}</div>
                    </td>
                    <td>
                      <span className={`badge ${getRoleBadgeClass(member.role)}`}>{member.role}</span>
                    </td>
                    <td className="text-muted">{member.totalLeads}</td>
                    <td className="text-muted">{member.openDeals}</td>
                    <td>
                      <span className="badge bg-success-subtle text-success border border-success-subtle">
                        {member.wonCount} Won
                      </span>
                    </td>
                    <td className="text-end pe-3 fw-bold text-success font-monospace">
                      {formatCurrency(member.wonRevenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
