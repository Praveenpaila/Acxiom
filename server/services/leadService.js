const Lead = require('../models/Lead');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Opportunity = require('../models/Opportunity');
const AppError = require('../utils/appError');
const { validateStatusTransition } = require('./leadWorkflow');
const auditService = require('./auditService');

class LeadService {
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

    // SalesExecutive sees only assigned or created leads
    return {
      $or: [
        { assignedTo: user._id },
        { createdBy: user._id },
      ],
    };
  }

  async verifyLeadAccess(lead, user) {
    if (!lead) {
      throw new AppError('Lead not found.', 404);
    }

    if (user.role === 'Admin') {
      return true;
    }

    const assignedId = lead.assignedTo?._id ? lead.assignedTo._id.toString() : lead.assignedTo?.toString();
    const createdId = lead.createdBy?._id ? lead.createdBy._id.toString() : lead.createdBy?.toString();

    if (user.role === 'Manager') {
      const teamExecutives = await User.find({ reportingTo: user._id }).select('_id');
      const allowedIds = new Set([
        user._id.toString(),
        ...teamExecutives.map((e) => e._id.toString()),
      ]);

      if (!allowedIds.has(assignedId) && !allowedIds.has(createdId)) {
        throw new AppError('Access denied: You do not have permission to access this lead.', 403);
      }
      return true;
    }

    if (assignedId !== user._id.toString() && createdId !== user._id.toString()) {
      throw new AppError('Access denied: You do not have permission to access this lead.', 403);
    }

    return true;
  }

  async generateLeadCode() {
    const lastLead = await Lead.findOne().sort({ createdAt: -1 }).select('leadCode');
    if (!lastLead || !lastLead.leadCode) {
      return 'LEAD-1001';
    }

    const match = lastLead.leadCode.match(/LEAD-(\d+)/);
    if (match) {
      const nextNum = parseInt(match[1], 10) + 1;
      return `LEAD-${nextNum}`;
    }

    return `LEAD-${Date.now().toString().slice(-4)}`;
  }

  async listLeads(query, user) {
    const roleFilter = await this.getScopedUserFilter(user);

    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = { ...roleFilter };

    if (query.status && query.status !== 'All') {
      filter.status = query.status;
    }

    if (query.search && query.search.trim()) {
      const s = query.search.trim();
      const searchRegex = new RegExp(s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');

      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { phone: searchRegex },
          { company: searchRegex },
          { leadCode: searchRegex },
        ],
      });
    }

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    const [leads, total] = await Promise.all([
      Lead.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('assignedTo', 'name email role')
        .populate('createdBy', 'name role')
        .populate('convertedCustomerId', 'customerCode company')
        .populate('convertedOpportunityId', 'name amount'),
      Lead.countDocuments(filter),
    ]);

    return {
      leads,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getLeadById(id, user) {
    const lead = await Lead.findById(id)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name role')
      .populate('convertedCustomerId', 'customerCode company')
      .populate('convertedOpportunityId', 'name amount');

    await this.verifyLeadAccess(lead, user);
    return lead;
  }

  async createLead(data, user) {
    let assignedUserId = data.assignedTo || user._id;

    const assignedUser = await User.findById(assignedUserId);
    if (!assignedUser) {
      throw new AppError('Assigned user does not exist.', 400);
    }

    const leadCode = await this.generateLeadCode();

    const lead = new Lead({
      leadCode,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim(),
      company: data.company.trim(),
      source: data.source || 'Website',
      status: 'New',
      expectedValue: data.expectedValue || 0,
      assignedTo: assignedUserId,
      createdBy: user._id,
      notes: (data.notes || '').trim(),
    });

    await lead.save();

    await auditService.log({
      userId: user._id,
      userEmail: user.email,
      action: 'CREATE',
      entityName: 'LEAD',
      recordId: lead._id,
      newValue: { leadCode: lead.leadCode, name: lead.name, company: lead.company, status: lead.status },
    });

    return lead.populate(['assignedTo', 'createdBy']);
  }

  async updateLead(id, data, user) {
    const lead = await Lead.findById(id);
    await this.verifyLeadAccess(lead, user);

    if (lead.status === 'Converted') {
      throw new AppError('Converted leads cannot be modified.', 400);
    }

    const oldValue = {
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      status: lead.status,
      assignedTo: lead.assignedTo,
    };

    if (data.assignedTo) {
      const assignedUser = await User.findById(data.assignedTo);
      if (!assignedUser) {
        throw new AppError('Assigned user does not exist.', 400);
      }
      lead.assignedTo = data.assignedTo;
    }

    if (data.name !== undefined) lead.name = data.name.trim();
    if (data.email !== undefined) lead.email = data.email.trim().toLowerCase();
    if (data.phone !== undefined) lead.phone = data.phone.trim();
    if (data.company !== undefined) lead.company = data.company.trim();
    if (data.source !== undefined) lead.source = data.source;
    if (data.expectedValue !== undefined) lead.expectedValue = data.expectedValue;
    if (data.notes !== undefined) lead.notes = data.notes.trim();

    await lead.save();

    await auditService.log({
      userId: user._id,
      userEmail: user.email,
      action: 'UPDATE',
      entityName: 'LEAD',
      recordId: lead._id,
      oldValue,
      newValue: {
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        status: lead.status,
        assignedTo: lead.assignedTo,
      },
    });

    return lead.populate(['assignedTo', 'createdBy']);
  }

  async updateLeadStatus(id, targetStatus, user) {
    const lead = await Lead.findById(id);
    await this.verifyLeadAccess(lead, user);

    if (targetStatus === 'Converted') {
      throw new AppError('To convert a lead, use the lead conversion workflow.', 400);
    }

    // Enforce state transition rules
    validateStatusTransition(lead.status, targetStatus);

    const oldStatus = lead.status;
    lead.status = targetStatus;
    await lead.save();

    await auditService.log({
      userId: user._id,
      userEmail: user.email,
      action: 'STATUS_CHANGE',
      entityName: 'LEAD',
      recordId: lead._id,
      oldValue: { status: oldStatus },
      newValue: { status: targetStatus },
    });

    return lead.populate(['assignedTo', 'createdBy']);
  }

  // Convert qualified lead to Customer + Opportunity
  async convertLead(id, convertData = {}, user) {
    const lead = await Lead.findById(id);
    await this.verifyLeadAccess(lead, user);

    if (lead.status === 'Converted') {
      throw new AppError('Lead has already been converted.', 400);
    }

    if (lead.status !== 'Qualified') {
      throw new AppError(
        `Only qualified leads can be converted. Current status is "${lead.status}".`,
        400
      );
    }

    // 1. Create or link Customer
    let customer = await Customer.findOne({
      $or: [{ email: lead.email }, { phone: lead.phone }],
    });

    if (!customer) {
      const customerService = require('./customerService');
      const customerCode = await customerService.generateCustomerCode();

      customer = new Customer({
        customerCode,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        status: 'Active',
        createdBy: user._id,
      });
      await customer.save();

      await auditService.log({
        userId: user._id,
        userEmail: user.email,
        action: 'CREATE',
        entityName: 'CUSTOMER',
        recordId: customer._id,
        newValue: { customerCode: customer.customerCode, name: customer.name },
      });
    }

    // 2. Validate expected close date if specified
    const closeDate = convertData.expectedCloseDate
      ? new Date(convertData.expectedCloseDate)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (closeDate < today) {
      throw new AppError('Expected Close Date cannot be in the past.', 400);
    }

    const oppAmount = convertData.amount && convertData.amount > 0
      ? convertData.amount
      : lead.expectedValue > 0
      ? lead.expectedValue
      : 150000;

    if (oppAmount <= 0) {
      throw new AppError('Opportunity Amount must be greater than 0.', 400);
    }

    // 3. Create Opportunity
    const opportunity = new Opportunity({
      name: convertData.dealName || `${lead.company} - Expansion Deal`,
      customerId: customer._id,
      leadId: lead._id,
      amount: oppAmount,
      stage: 'Qualification',
      probability: 25,
      expectedCloseDate: closeDate,
      status: 'Open',
      assignedTo: lead.assignedTo || user._id,
      createdBy: user._id,
    });
    await opportunity.save();

    await auditService.log({
      userId: user._id,
      userEmail: user.email,
      action: 'CREATE',
      entityName: 'OPPORTUNITY',
      recordId: opportunity._id,
      newValue: { name: opportunity.name, amount: opportunity.amount },
    });

    // 4. Update lead status to Converted and link records
    lead.status = 'Converted';
    lead.convertedCustomerId = customer._id;
    lead.convertedOpportunityId = opportunity._id;
    lead.convertedAt = new Date();
    await lead.save();

    await auditService.log({
      userId: user._id,
      userEmail: user.email,
      action: 'LEAD_CONVERTED',
      entityName: 'LEAD',
      recordId: lead._id,
      newValue: {
        convertedCustomerId: customer._id,
        convertedOpportunityId: opportunity._id,
      },
    });

    return {
      lead: await lead.populate(['assignedTo', 'convertedCustomerId', 'convertedOpportunityId']),
      customer,
      opportunity,
    };
  }

  async deleteLead(id, user) {
    const lead = await Lead.findById(id);
    await this.verifyLeadAccess(lead, user);

    if (lead.status === 'Converted') {
      throw new AppError('Converted leads cannot be deleted.', 400);
    }

    await Lead.findByIdAndDelete(id);

    await auditService.log({
      userId: user._id,
      userEmail: user.email,
      action: 'DELETE',
      entityName: 'LEAD',
      recordId: lead._id,
    });

    return { message: 'Lead deleted successfully.', deleted: true };
  }
}

module.exports = new LeadService();
