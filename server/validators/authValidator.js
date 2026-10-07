const { z } = require('zod');

// 10-digit Indian mobile starting with 6, 7, 8, or 9
const indianPhoneRegex = /^[6-9]\d{9}$/;

// Password rules: min 8, uppercase, lowercase, digit, symbol
const passwordSchema = z
  .string({ required_error: 'Password is required.' })
  .min(8, 'Password must be at least 8 characters long.')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
  .regex(/[0-9]/, 'Password must contain at least one digit.')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one symbol.');

const registerSchema = z.object({
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

const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required.' })
    .trim()
    .email('Enter a valid email address.'),
  password: z
    .string({ required_error: 'Password is required.' })
    .min(1, 'Password is required.'),
});

module.exports = {
  indianPhoneRegex,
  passwordSchema,
  registerSchema,
  loginSchema,
};
