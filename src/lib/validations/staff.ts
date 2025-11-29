import { z } from 'zod';
import { emailSchema, passwordSchema, nameSchema, uuidSchema } from './common';

/**
 * Staff validation schemas
 */

export const createStaffSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: nameSchema,
  departmentId: uuidSchema,
  role: z.enum(['staff', 'department_head', 'super_admin'], {
    errorMap: () => ({ message: 'Invalid role selected' }),
  }),
});

export const updateStaffProfileSchema = z.object({
  fullName: nameSchema,
  email: emailSchema,
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const suspendStaffSchema = z.object({
  reason: z.string().min(1, 'Suspension reason is required').max(500, 'Reason must be less than 500 characters'),
});

export const deleteStaffSchema = z.object({
  reason: z.string().min(1, 'Deletion reason is required').max(500, 'Reason must be less than 500 characters'),
});

