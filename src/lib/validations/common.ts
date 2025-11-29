import { z } from 'zod';

/**
 * Common validation schemas
 */

export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be less than 100 characters');

export const uuidSchema = z.string().uuid('Invalid ID format');

export const positiveNumberSchema = z
  .number()
  .positive('Must be a positive number');

export const nonNegativeNumberSchema = z
  .number()
  .nonnegative('Must be a non-negative number');

export const dateSchema = z.string().or(z.date());

export const optionalStringSchema = z.string().optional();

export const requiredStringSchema = z.string().min(1, 'This field is required');

