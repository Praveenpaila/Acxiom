const Opportunity = require('../models/Opportunity');
const Customer = require('../models/Customer');
const Lead = require('../models/Lead');
const User = require('../models/User');
const AppError = require('../utils/appError');
const { isCloseDateInPast } = require('../validators/opportunityValidator');

class OpportunityService {
  async getScopedUserFilter(user) {
    if (user.role === 'Admin') {
      return {};
    }

    if (user.role === 'Manager') {
      const teamExecutives = await User.find({ reportingTo: user._id }).select('_id');
      const teamUserIds = [user._id, ...teamExecutives.map((e) => e._id)];
      return {
        $or: [
          { assignedTo: { $in: teamUserIds } },
          { createdBy: { $in: teamUserIds } },
        ],
      };
    }

    return {
      $or: [
        { assignedTo: user._id },
        { createdBy: user._id },
      ],
    };
  }

  async verifyAccess(opp, user) {
    if (!opp) {
      throw new AppError('Opportunity not found.', 404);
    }

    if (user.role === 'Admin') {
      return true;
    }

    const assignedId = opp.assignedTo?._id ? opp.assignedTo._id.toString() : opp.assignedTo?.toString();
    const createdId = opp.createdBy?._id ? opp.createdBy._id.toString() : opp.createdBy?.toString();

    if (user.role === 'Manager') {
      const teamExecutives = await User.find({ reportingTo: user._id }).select('_id');
      const allowedIds = new Set([
        user._id.toString(),
        ...teamExecutives.map((e) => e._id.toString()),
      ]);

      if (!allowedIds.has(assignedId) && !allowedIds.has(createdId)) {
        throw new AppError('Access denied: You do not have permission to access this opportunity.', 403);
      }
      return true;
    }

    if (assignedId !== user._id.toString() && createdId !== user._id.toString()) {
      throw new AppError('Access denied: You do not have permission to access this opportunity.', 403);
    }

    return true;
  }

  async listOpportunities(query, user) {
    const roleFilter = await this.getScopedUserFilter(user);

    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = { ...roleFilter };

    if (query.stage && query.stage !== 'All') {
      filter.stage = query.stage;
    }

    if (query.status && query.status !== 'All') {
      filter.status = query.status;
    }

    if (query.search && query.search.trim()) {
      const s = query.search.trim();
      const searchRegex = new RegExp(s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
      filter.name = searchRegex;
    }

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    const [opps, total] = await Promise.all([
      Opportunity.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('customerId', 'customerCode company name')
        .populate('leadId', 'leadCode company')
        .populate('assignedTo', 'name email role')
        .populate('createdBy', 'name role'),
      Opportunity.countDocuments(filter),
    ]);

    return {
      opportunities: opps,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getOpportunityById(id, user) {
    const opp = await Opportunity.findById(id)
      .populate('customerId', 'customerCode company name')
      .populate('leadId', 'leadCode company')
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name role');

    await this.verifyAccess(opp, user);
    return opp;
  }

  async createOpportunity(data, user) {
    // Validate referenced customer
    const customer = await Customer.findById(data.customerId);
    if (!customer) {
      throw new AppError('Referenced customer does not exist.', 400);
    }

    if (data.leadId) {
      const lead = await Lead.findById(data.leadId);
      if (!lead) {
        throw new AppError('Referenced lead does not exist.', 400);
      }
    }

    let assignedId = data.assignedTo || user._id;
    const assignedUser = await User.findById(assignedId);
    if (!assignedUser) {
      throw new AppError('Assigned user does not exist.', 400);
    }

    // Business rule checks
    if (data.amount <= 0) {
      throw new AppError('Opportunity Amount must be greater than 0.', 400);
    }

    if (data.probability < 0 || data.probability > 100) {
      throw new AppError('Probability must be between 0 and 100.', 400);
    }

    if (isCloseDateInPast(data.expectedCloseDate, data.stage)) {
      throw new AppError('Expected Close Date cannot be in the past.', 400);
    }

    const opp = new Opportunity({
      name: data.name.trim(),
      customerId: data.customerId,
      leadId: data.leadId || null,
      amount: data.amount,
      stage: data.stage || 'Qualification',
      probability: typeof data.probability === 'number' ? data.probability : 25,
      expectedCloseDate: new Date(data.expectedCloseDate),
      assignedTo: assignedId,
      createdBy: user._id,
      notes: (data.notes || '').trim(),
    });

    await opp.save();
    return opp.populate(['customerId', 'leadId', 'assignedTo', 'createdBy']);
  }

  async updateOpportunity(id, data, user) {
    const opp = await Opportunity.findById(id);
    await this.verifyAccess(opp, user);

    if (data.customerId) {
      const customer = await Customer.findById(data.customerId);
      if (!customer) throw new AppError('Referenced customer does not exist.', 400);
      opp.customerId = data.customerId;
    }

    if (data.assignedTo) {
      const assignedUser = await User.findById(data.assignedTo);
      if (!assignedUser) throw new AppError('Assigned user does not exist.', 400);
      opp.assignedTo = data.assignedTo;
    }

    if (data.amount !== undefined) {
      if (data.amount <= 0) {
        throw new AppError('Opportunity Amount must be greater than 0.', 400);
      }
      opp.amount = data.amount;
    }

    if (data.probability !== undefined) {
      if (data.probability < 0 || data.probability > 100) {
        throw new AppError('Probability must be between 0 and 100.', 400);
      }
      opp.probability = data.probability;
    }

    if (data.expectedCloseDate !== undefined) {
      const targetStage = data.stage || opp.stage;
      if (isCloseDateInPast(data.expectedCloseDate, targetStage)) {
        throw new AppError('Expected Close Date cannot be in the past.', 400);
      }
      opp.expectedCloseDate = new Date(data.expectedCloseDate);
    }

    if (data.name !== undefined) opp.name = data.name.trim();
    if (data.stage !== undefined) opp.stage = data.stage;
    if (data.notes !== undefined) opp.notes = data.notes.trim();

    await opp.save();
    return opp.populate(['customerId', 'leadId', 'assignedTo', 'createdBy']);
  }

  async deleteOpportunity(id, user) {
    const opp = await Opportunity.findById(id);
    await this.verifyAccess(opp, user);

    await Opportunity.findByIdAndDelete(id);
    return { message: 'Opportunity deleted successfully.', deleted: true };
  }

  // Pipeline aggregate statistics scoped by user role
  async getPipelineReport(user) {
    const roleFilter = await this.getScopedUserFilter(user);

    const opps = await Opportunity.find(roleFilter);

    let totalAmount = 0;
    let weightedPipeline = 0;
    let openCount = 0;
    let wonCount = 0;
    let lostCount = 0;
    let wonAmount = 0;

    const stageBreakdown = {
      Qualification: { count: 0, amount: 0 },
      Proposal: { count: 0, amount: 0 },
      Negotiation: { count: 0, amount: 0 },
      Won: { count: 0, amount: 0 },
      Lost: { count: 0, amount: 0 },
    };

    opps.forEach((o) => {
      totalAmount += o.amount;
      const weighted = Math.round((o.amount * o.probability) / 100);
      weightedPipeline += weighted;

      if (o.status === 'Open') openCount++;
      if (o.status === 'Won') {
        wonCount++;
        wonAmount += o.amount;
      }
      if (o.status === 'Lost') lostCount++;

      if (stageBreakdown[o.stage]) {
        stageBreakdown[o.stage].count += 1;
        stageBreakdown[o.stage].amount += o.amount;
      }
    });

    return {
      totalOpportunities: opps.length,
      totalPipelineValue: totalAmount,
      weightedPipelineValue: weightedPipeline,
      openCount,
      wonCount,
      lostCount,
      wonAmount,
      stageBreakdown,
    };
  }
}

module.exports = new OpportunityService();
