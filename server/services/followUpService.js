const FollowUp = require('../models/FollowUp');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Lead = require('../models/Lead');
const Opportunity = require('../models/Opportunity');
const AppError = require('../utils/appError');
const { isDateBeforeToday } = require('../validators/followUpValidator');

class FollowUpService {
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

  async verifyAccess(item, user) {
    if (!item) {
      throw new AppError('Follow-up activity not found.', 404);
    }

    if (user.role === 'Admin') {
      return true;
    }

    const assignedId = item.assignedTo?._id ? item.assignedTo._id.toString() : item.assignedTo?.toString();
    const createdId = item.createdBy?._id ? item.createdBy._id.toString() : item.createdBy?.toString();

    if (user.role === 'Manager') {
      const teamExecutives = await User.find({ reportingTo: user._id }).select('_id');
      const allowedIds = new Set([
        user._id.toString(),
        ...teamExecutives.map((e) => e._id.toString()),
      ]);

      if (!allowedIds.has(assignedId) && !allowedIds.has(createdId)) {
        throw new AppError('Access denied: You do not have permission to access this activity.', 403);
      }
      return true;
    }

    if (assignedId !== user._id.toString() && createdId !== user._id.toString()) {
      throw new AppError('Access denied: You do not have permission to access this activity.', 403);
    }

    return true;
  }

  async listFollowUps(query, user) {
    const roleFilter = await this.getScopedUserFilter(user);

    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = { ...roleFilter };

    // View filter
    const now = new Date();
    if (query.view === 'pending') {
      filter.status = 'Pending';
    } else if (query.view === 'overdue') {
      filter.status = 'Pending';
      filter.dueDate = { $lt: now };
    } else if (query.view === 'completed') {
      filter.status = 'Completed';
    } else if (query.status && query.status !== 'All') {
      filter.status = query.status;
    }

    // Type filter
    if (query.type && query.type !== 'All') {
      filter.type = query.type;
    }

    if (query.search && query.search.trim()) {
      const s = query.search.trim();
      const searchRegex = new RegExp(s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
      filter.title = searchRegex;
    }

    const sortBy = query.sortBy || 'dueDate';
    const sortOrder = query.sortOrder === 'desc' ? -1 : 1; // Default ascending so soonest follow-ups show first
    const sort = { [sortBy]: sortOrder };

    const [items, total] = await Promise.all([
      FollowUp.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('assignedTo', 'name email role')
        .populate('createdBy', 'name role')
        .populate('customerId', 'customerCode company name')
        .populate('leadId', 'leadCode company name')
        .populate('opportunityId', 'name amount'),
      FollowUp.countDocuments(filter),
    ]);

    return {
      followUps: items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getFollowUpById(id, user) {
    const item = await FollowUp.findById(id)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name role')
      .populate('customerId', 'customerCode company name')
      .populate('leadId', 'leadCode company name')
      .populate('opportunityId', 'name amount');

    await this.verifyAccess(item, user);
    return item;
  }

  async createFollowUp(data, user) {
    // Business rule: New follow-up before today -> 400
    if (isDateBeforeToday(data.dueDate)) {
      throw new AppError('Follow-up date cannot be earlier than today.', 400);
    }

    // Validate referenced IDs
    if (data.customerId) {
      const exists = await Customer.findById(data.customerId);
      if (!exists) throw new AppError('Referenced customer does not exist.', 400);
    }

    if (data.leadId) {
      const exists = await Lead.findById(data.leadId);
      if (!exists) throw new AppError('Referenced lead does not exist.', 400);
    }

    if (data.opportunityId) {
      const exists = await Opportunity.findById(data.opportunityId);
      if (!exists) throw new AppError('Referenced opportunity does not exist.', 400);
    }

    let assignedId = data.assignedTo || user._id;
    const assignedUser = await User.findById(assignedId);
    if (!assignedUser) {
      throw new AppError('Assigned user does not exist.', 400);
    }

    const followUp = new FollowUp({
      type: data.type,
      title: data.title.trim(),
      description: (data.description || '').trim(),
      customerId: data.customerId || null,
      leadId: data.leadId || null,
      opportunityId: data.opportunityId || null,
      dueDate: new Date(data.dueDate),
      priority: data.priority || 'Medium',
      assignedTo: assignedId,
      createdBy: user._id,
      status: 'Pending',
    });

    await followUp.save();
    return followUp.populate(['assignedTo', 'customerId', 'leadId', 'opportunityId']);
  }

  async rescheduleFollowUp(id, data, user) {
    const item = await FollowUp.findById(id);
    await this.verifyAccess(item, user);

    if (item.status === 'Completed') {
      throw new AppError('Completed follow-up activities cannot be rescheduled.', 400);
    }

    if (isDateBeforeToday(data.dueDate)) {
      throw new AppError('Follow-up date cannot be earlier than today.', 400);
    }

    item.dueDate = new Date(data.dueDate);
    item.status = 'Pending'; // Remains or resets to active Pending with new date

    if (data.notes) {
      item.description = item.description
        ? `${item.description}\n[Rescheduled: ${data.notes}]`
        : `[Rescheduled: ${data.notes}]`;
    }

    await item.save();
    return item.populate(['assignedTo', 'customerId', 'leadId', 'opportunityId']);
  }

  async completeFollowUp(id, data, user) {
    const item = await FollowUp.findById(id);
    await this.verifyAccess(item, user);

    item.status = 'Completed';
    item.completedAt = new Date();
    item.completedNotes = (data.completedNotes || '').trim();

    await item.save();
    return item.populate(['assignedTo', 'customerId', 'leadId', 'opportunityId']);
  }

  async deleteFollowUp(id, user) {
    const item = await FollowUp.findById(id);
    await this.verifyAccess(item, user);

    await FollowUp.findByIdAndDelete(id);
    return { message: 'Follow-up activity deleted successfully.', deleted: true };
  }
}

module.exports = new FollowUpService();
