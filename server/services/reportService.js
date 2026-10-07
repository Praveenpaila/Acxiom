const Customer = require('../models/Customer');
const Lead = require('../models/Lead');
const Opportunity = require('../models/Opportunity');
const FollowUp = require('../models/FollowUp');
const User = require('../models/User');
const AppError = require('../utils/appError');
const { generateCsv } = require('../utils/csvExport');

class ReportService {
  async getScopedIds(user) {
    if (user.role === 'Admin') {
      return null; // Null means unrestricted
    }

    if (user.role === 'Manager') {
      const team = await User.find({ reportingTo: user._id }).select('_id');
      return [user._id, ...team.map((t) => t._id)];
    }

    return [user._id];
  }

  // Dashboard KPI Metrics and Aggregations
  async getDashboardSummary(user) {
    const allowedIds = await this.getScopedIds(user);

    const customerFilter = allowedIds ? { createdBy: { $in: allowedIds } } : {};
    const leadFilter = allowedIds ? { $or: [{ assignedTo: { $in: allowedIds } }, { createdBy: { $in: allowedIds } }] } : {};
    const oppFilter = allowedIds ? { $or: [{ assignedTo: { $in: allowedIds } }, { createdBy: { $in: allowedIds } }] } : {};
    const followUpFilter = allowedIds ? { $or: [{ assignedTo: { $in: allowedIds } }, { createdBy: { $in: allowedIds } }] } : {};

    // Parallel fetch for snappy dashboard load
    const [
      totalCustomers,
      leads,
      opportunities,
      followUps,
    ] = await Promise.all([
      Customer.countDocuments(customerFilter),
      Lead.find(leadFilter).select('status source expectedValue createdAt'),
      Opportunity.find(oppFilter).select('amount probability stage status expectedCloseDate createdAt'),
      FollowUp.find(followUpFilter).select('type status dueDate priority createdAt'),
    ]);

    // Lead calculations
    const totalLeads = leads.length;
    let openLeads = 0;
    let convertedLeads = 0;
    const leadsByStatus = {
      New: 0,
      Contacted: 0,
      Qualified: 0,
      Unqualified: 0,
      Converted: 0,
    };
    const leadsBySource = {};

    leads.forEach((l) => {
      if (['New', 'Contacted', 'Qualified'].includes(l.status)) {
        openLeads++;
      }
      if (l.status === 'Converted') {
        convertedLeads++;
      }
      if (leadsByStatus[l.status] !== undefined) {
        leadsByStatus[l.status]++;
      }
      leadsBySource[l.source] = (leadsBySource[l.source] || 0) + 1;
    });

    const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

    // Opportunity & Pipeline calculations
    let totalPipelineValue = 0;
    let weightedPipelineValue = 0;
    let wonDealsAmount = 0;
    let wonDealsCount = 0;
    let openDealsCount = 0;

    const pipelineByStage = {
      Qualification: { count: 0, amount: 0 },
      Proposal: { count: 0, amount: 0 },
      Negotiation: { count: 0, amount: 0 },
      Won: { count: 0, amount: 0 },
      Lost: { count: 0, amount: 0 },
    };

    opportunities.forEach((o) => {
      totalPipelineValue += o.amount;
      const weighted = Math.round((o.amount * o.probability) / 100);
      weightedPipelineValue += weighted;

      if (o.status === 'Won') {
        wonDealsAmount += o.amount;
        wonDealsCount++;
      }
      if (o.status === 'Open') {
        openDealsCount++;
      }

      if (pipelineByStage[o.stage]) {
        pipelineByStage[o.stage].count += 1;
        pipelineByStage[o.stage].amount += o.amount;
      }
    });

    // Follow-Up calculations
    const now = new Date();
    let pendingFollowUps = 0;
    let overdueFollowUps = 0;
    let completedFollowUps = 0;

    followUps.forEach((f) => {
      if (f.status === 'Completed') {
        completedFollowUps++;
      } else if (f.status === 'Pending') {
        pendingFollowUps++;
        if (new Date(f.dueDate) < now) {
          overdueFollowUps++;
        }
      }
    });

    // Leaderboard for Admin and Manager
    let teamPerformance = [];
    if (user.role === 'Admin' || user.role === 'Manager') {
      const teamUsers = allowedIds
        ? await User.find({ _id: { $in: allowedIds } }).select('name email role')
        : await User.find({ isActive: true }).select('name email role');

      const allUserOpps = await Opportunity.find(oppFilter).populate('assignedTo', 'name');
      const allUserLeads = await Lead.find(leadFilter).populate('assignedTo', 'name');

      const userMap = {};
      teamUsers.forEach((u) => {
        userMap[u._id.toString()] = {
          id: u._id,
          name: u.name,
          email: u.email,
          role: u.role,
          wonRevenue: 0,
          wonCount: 0,
          openDeals: 0,
          totalLeads: 0,
        };
      });

      allUserOpps.forEach((o) => {
        const uid = o.assignedTo?._id?.toString() || o.assignedTo?.toString();
        if (uid && userMap[uid]) {
          if (o.status === 'Won') {
            userMap[uid].wonRevenue += o.amount;
            userMap[uid].wonCount += 1;
          } else if (o.status === 'Open') {
            userMap[uid].openDeals += 1;
          }
        }
      });

      allUserLeads.forEach((l) => {
        const uid = l.assignedTo?._id?.toString() || l.assignedTo?.toString();
        if (uid && userMap[uid]) {
          userMap[uid].totalLeads += 1;
        }
      });

      teamPerformance = Object.values(userMap).sort((a, b) => b.wonRevenue - a.wonRevenue);
    }

    return {
      kpis: {
        totalCustomers,
        totalLeads,
        openLeads,
        convertedLeads,
        conversionRate,
        totalOpportunities: opportunities.length,
        openDealsCount,
        wonDealsCount,
        wonDealsAmount,
        totalPipelineValue,
        weightedPipelineValue,
        pendingFollowUps,
        overdueFollowUps,
        completedFollowUps,
      },
      charts: {
        leadsByStatus,
        leadsBySource,
        pipelineByStage,
      },
      teamPerformance,
    };
  }

  // Generate Tabular Report Data for View or Export
  async getReportData(type, user) {
    const allowedIds = await this.getScopedIds(user);

    switch (type) {
      case 'customers': {
        const filter = allowedIds ? { createdBy: { $in: allowedIds } } : {};
        const data = await Customer.find(filter)
          .sort({ createdAt: -1 })
          .populate('createdBy', 'name email role');

        const columns = [
          { key: 'customerCode', label: 'Customer Code' },
          { key: 'name', label: 'Customer Name' },
          { key: 'company', label: 'Company' },
          { key: 'email', label: 'Email' },
          { key: 'phone', label: 'Phone' },
          { key: 'city', label: 'City' },
          { key: 'state', label: 'State' },
          { key: 'status', label: 'Status' },
          { key: 'createdBy', label: 'Account Owner', accessor: (r) => r.createdBy?.name || '' },
          { key: 'createdAt', label: 'Created Date' },
        ];
        return { columns, data };
      }

      case 'leads': {
        const filter = allowedIds ? { $or: [{ assignedTo: { $in: allowedIds } }, { createdBy: { $in: allowedIds } }] } : {};
        const data = await Lead.find(filter)
          .sort({ createdAt: -1 })
          .populate('assignedTo', 'name')
          .populate('createdBy', 'name');

        const columns = [
          { key: 'leadCode', label: 'Lead Code' },
          { key: 'name', label: 'Contact Name' },
          { key: 'company', label: 'Company' },
          { key: 'email', label: 'Email' },
          { key: 'phone', label: 'Phone' },
          { key: 'source', label: 'Source Channel' },
          { key: 'status', label: 'Lifecycle Status' },
          { key: 'expectedValue', label: 'Expected Value (INR)' },
          { key: 'assignedTo', label: 'Assigned Executive', accessor: (r) => r.assignedTo?.name || '' },
          { key: 'createdAt', label: 'Created Date' },
        ];
        return { columns, data };
      }

      case 'opportunities': {
        const filter = allowedIds ? { $or: [{ assignedTo: { $in: allowedIds } }, { createdBy: { $in: allowedIds } }] } : {};
        const data = await Opportunity.find(filter)
          .sort({ createdAt: -1 })
          .populate('customerId', 'name company customerCode')
          .populate('assignedTo', 'name');

        const columns = [
          { key: 'name', label: 'Opportunity Name' },
          { key: 'company', label: 'Customer', accessor: (r) => r.customerId?.company || r.customerId?.name || '' },
          { key: 'amount', label: 'Deal Amount (INR)' },
          { key: 'stage', label: 'Pipeline Stage' },
          { key: 'probability', label: 'Win Probability (%)' },
          { key: 'weightedAmount', label: 'Weighted Forecast (INR)', accessor: (r) => Math.round((r.amount * r.probability) / 100) },
          { key: 'status', label: 'Deal Status' },
          { key: 'expectedCloseDate', label: 'Expected Close Date' },
          { key: 'assignedTo', label: 'Deal Owner', accessor: (r) => r.assignedTo?.name || '' },
        ];
        return { columns, data };
      }

      case 'followups': {
        const filter = allowedIds ? { $or: [{ assignedTo: { $in: allowedIds } }, { createdBy: { $in: allowedIds } }] } : {};
        const data = await FollowUp.find(filter)
          .sort({ dueDate: 1 })
          .populate('assignedTo', 'name');

        const columns = [
          { key: 'type', label: 'Activity Type' },
          { key: 'title', label: 'Subject / Title' },
          { key: 'priority', label: 'Priority' },
          { key: 'status', label: 'Status' },
          { key: 'dueDate', label: 'Due Date' },
          { key: 'completedAt', label: 'Completed Date' },
          { key: 'assignedTo', label: 'Assigned To', accessor: (r) => r.assignedTo?.name || '' },
          { key: 'completedNotes', label: 'Outcome Notes' },
        ];
        return { columns, data };
      }

      default:
        throw new AppError(`Invalid report type: ${type}`, 400);
    }
  }

  // Export report as RFC 4180 CSV
  async exportReportToCsv(type, user) {
    const { columns, data } = await this.getReportData(type, user);
    return generateCsv(columns, data);
  }
}

module.exports = new ReportService();
