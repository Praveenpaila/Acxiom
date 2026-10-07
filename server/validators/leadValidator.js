const { z } = require('zod');
const { indianPhoneRegex } = require('./authValidator');
const { LEAD_STATUSES, LEAD_SOURCES } = require('../models/Lead');

const createLeadSchema = z.object({
  name: z
    .string({ required_error: 'Lead name is required.' })
    .trim()
    .min(2, 'Lead name must be at least 2 characters.')
    .max(100, 'Lead name cannot exceed 100 characters.'),
  email: z
    .string({ required_error: 'Email is required.' })
    .trim()
    .email('Enter a valid email address.'),
  phone: z
    .string({ required_error: 'Phone is required.' })
    .trim()
    .regex(indianPhoneRegex, 'Enter a valid phone number.'),
  company: z
    .string({ required_error: 'Company name is required.' })
    .trim()
    .min(2, 'Company name must be at least 2 characters.')
    .max(100, 'Company name cannot exceed 100 characters.'),
  source: z.enum(LEAD_SOURCES).optional().default('Website'),
  expectedValue: z.number().min(0, 'Expected value cannot be negative.').optional().default(0),
  assignedTo: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format.').optional(),
  notes: z.string().trim().max(1000).optional().default(''),
});

const updateLeadSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  email: z.string().trim().email('Enter a valid email address.').optional(),
  phone: z.string().trim().regex(indianPhoneRegex, 'Enter a valid phone number.').optional(),
  company: z.string().trim().min(2).max(100).optional(),
  source: z.enum(LEAD_SOURCES).optional(),
  expectedValue: z.number().min(0).optional(),
  assignedTo: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format.').optional(),
  notes: z.string().trim().max(1000).optional(),
});

const updateLeadStatusSchema = z.object({
  status: z.enum(LEAD_STATUSES, {
    required_error: 'Target status is required.',
  }),
});

const convertLeadSchema = z.object({
  dealName: z.string().trim().min(2, 'Deal name must be at least 2 characters.').optional(),
  amount: z.number().min(0.01, 'Opportunity Amount must be greater than 0.').optional(),
  expectedCloseDate: z.string().optional(),
});

module.exports = {
  createLeadSchema,
  updateLeadSchema,
  updateLeadStatusSchema,
  convertLeadSchema,
};
