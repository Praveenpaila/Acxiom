const mongoose = require('mongoose');

const ACTIVITY_TYPES = ['Call', 'Meeting', 'Email', 'Task'];
const FOLLOWUP_STATUSES = ['Pending', 'Completed', 'Rescheduled', 'Cancelled'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

const followUpSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ACTIVITY_TYPES,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
      index: true,
    },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      default: null,
      index: true,
    },
    opportunityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Opportunity',
      default: null,
      index: true,
    },
    dueDate: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: FOLLOWUP_STATUSES,
      default: 'Pending',
      index: true,
    },
    priority: {
      type: String,
      enum: PRIORITIES,
      default: 'Medium',
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    completedNotes: {
      type: String,
      trim: true,
      default: '',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual to check if pending item is overdue
followUpSchema.virtual('isOverdue').get(function () {
  if (this.status !== 'Pending') return false;
  return new Date(this.dueDate).getTime() < Date.now();
});

const FollowUp = mongoose.model('FollowUp', followUpSchema);

module.exports = FollowUp;
module.exports.ACTIVITY_TYPES = ACTIVITY_TYPES;
module.exports.FOLLOWUP_STATUSES = FOLLOWUP_STATUSES;
module.exports.PRIORITIES = PRIORITIES;
