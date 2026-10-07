const { z } = require('zod');
const { indianPhoneRegex, passwordSchema } = require('./authValidator');

const createUserSchema = z.object({
  name: z
    .string({ required_error: 'Name is required.' })
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(100, 'Name cannot exceed 100 characters.'),
  email: z
    .string({ required_error: 'Email is required.' })
    .trim()
    .email('Enter a valid email address.'),
  phone: z
    .string({ required_error: 'Phone is required.' })
    .trim()
    .regex(indianPhoneRegex, 'Enter a valid phone number.'),
  password: passwordSchema,
  role: z.enum(['Admin', 'Manager', 'SalesExecutive']).optional(),
  reportingTo: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid manager ID format.').nullable().optional(),
});

const updateUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(100, 'Name cannot exceed 100 characters.')
    .optional(),
  phone: z
    .string()
    .trim()
    .regex(indianPhoneRegex, 'Enter a valid phone number.')
    .optional(),
  role: z.enum(['Admin', 'Manager', 'SalesExecutive']).optional(),
  reportingTo: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid manager ID format.').nullable().optional(),
});

const resetPasswordSchema = z.object({
  password: passwordSchema,
});

const toggleStatusSchema = z.object({
  isActive: z.boolean({ required_error: 'isActive flag is required.' }),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  resetPasswordSchema,
  toggleStatusSchema,
};
