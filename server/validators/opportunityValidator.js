const { z } = require('zod');
const { OPPORTUNITY_STAGES } = require('../models/Opportunity');

const isCloseDateInPast = (dateVal, stage) => {
  // If stage is already Won or Lost, past close dates are acceptable historically
  if (stage === 'Won' || stage === 'Lost') return false;

  const target = new Date(dateVal);
  if (isNaN(target.getTime())) return true;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return target < today;
};

const createOpportunitySchema = z.object({
  name: z
    .string({ required_error: 'Opportunity name is required.' })
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(150),
  customerId: z
    .string({ required_error: 'Customer ID is required.' })
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid customer ID format.'),
  leadId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid lead ID format.')
    .nullable()
    .optional(),
  amount: z
    .number({ required_error: 'Opportunity Amount must be greater than 0.' })
    .refine((val) => val > 0, {
      message: 'Opportunity Amount must be greater than 0.',
    }),
  stage: z.enum(OPPORTUNITY_STAGES).optional().default('Qualification'),
  probability: z
    .number({ required_error: 'Probability must be between 0 and 100.' })
    .refine((val) => val >= 0 && val <= 100, {
      message: 'Probability must be between 0 and 100.',
    })
    .optional()
    .default(25),
  expectedCloseDate: z
    .string({ required_error: 'Expected close date is required.' })
    .refine((val) => !isCloseDateInPast(val), {
      message: 'Expected Close Date cannot be in the past.',
    }),
  assignedTo: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format.')
    .optional(),
  notes: z.string().trim().max(1000).optional().default(''),
});

const updateOpportunitySchema = z.object({
  name: z.string().trim().min(2).max(150).optional(),
  customerId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid customer ID format.').optional(),
  amount: z
    .number()
    .refine((val) => val > 0, {
      message: 'Opportunity Amount must be greater than 0.',
    })
    .optional(),
  stage: z.enum(OPPORTUNITY_STAGES).optional(),
  probability: z
    .number()
    .refine((val) => val >= 0 && val <= 100, {
      message: 'Probability must be between 0 and 100.',
    })
    .optional(),
  expectedCloseDate: z
    .string()
    .optional(),
  assignedTo: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format.').optional(),
  notes: z.string().trim().max(1000).optional(),
});

module.exports = {
  createOpportunitySchema,
  updateOpportunitySchema,
  isCloseDateInPast,
};
