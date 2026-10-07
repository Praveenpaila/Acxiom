const { z } = require('zod');
const { indianPhoneRegex } = require('./authValidator');

const createCustomerSchema = z.object({
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
  company: z
    .string({ required_error: 'Company name is required.' })
    .trim()
    .min(2, 'Company name must be at least 2 characters.')
    .max(100, 'Company name cannot exceed 100 characters.'),
  address: z.string().trim().max(250).optional().default(''),
  city: z.string().trim().max(100).optional().default(''),
  state: z.string().trim().max(100).optional().default(''),
  status: z.enum(['Active', 'Inactive']).optional().default('Active'),
});

const updateCustomerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(100).optional(),
  email: z.string().trim().email('Enter a valid email address.').optional(),
  phone: z.string().trim().regex(indianPhoneRegex, 'Enter a valid phone number.').optional(),
  company: z.string().trim().min(2, 'Company name must be at least 2 characters.').max(100).optional(),
  address: z.string().trim().max(250).optional(),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  status: z.enum(['Active', 'Inactive']).optional(),
});

module.exports = {
  createCustomerSchema,
  updateCustomerSchema,
};
