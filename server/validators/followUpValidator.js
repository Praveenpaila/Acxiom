const { z } = require('zod');
const { ACTIVITY_TYPES, PRIORITIES, FOLLOWUP_STATUSES } = require('../models/FollowUp');

// Check if a date string/Date is earlier than today (start of day)
const isDateBeforeToday = (dateValue) => {
  const target = new Date(dateValue);
  if (isNaN(target.getTime())) return true;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return target < today;
};

const createFollowUpSchema = z.object({
  type: z.enum(ACTIVITY_TYPES, {
    required_error: 'Activity type is required.',
  }),
  title: z
    .string({ required_error: 'Title is required.' })
    .trim()
    .min(2, 'Title must be at least 2 characters.')
    .max(150, 'Title cannot exceed 150 characters.'),
  description: z.string().trim().max(1000).optional().default(''),
  customerId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid customer ID format.').nullable().optional(),
  leadId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid lead ID format.').nullable().optional(),
  opportunityId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid opportunity ID format.').nullable().optional(),
  dueDate: z
    .string({ required_error: 'Follow-up date is required.' })
    .refine((val) => !isDateBeforeToday(val), {
      message: 'Follow-up date cannot be earlier than today.',
    }),
  priority: z.enum(PRIORITIES).optional().default('Medium'),
  assignedTo: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format.').optional(),
});

const rescheduleFollowUpSchema = z.object({
  dueDate: z
    .string({ required_error: 'New follow-up date is required.' })
    .refine((val) => !isDateBeforeToday(val), {
      message: 'Follow-up date cannot be earlier than today.',
    }),
  notes: z.string().trim().max(500).optional(),
});

const completeFollowUpSchema = z.object({
  completedNotes: z.string().trim().max(1000).optional().default(''),
});

module.exports = {
  createFollowUpSchema,
  rescheduleFollowUpSchema,
  completeFollowUpSchema,
  isDateBeforeToday,
};
