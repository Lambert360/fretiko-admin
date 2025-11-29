import { z } from 'zod';
import { requiredStringSchema } from './common';

/**
 * Report validation schemas
 */

export const createReportSchema = z.object({
  title: requiredStringSchema.max(200, 'Title must be less than 200 characters'),
  type: z.enum(['incident', 'suggestion', 'bug', 'other']),
  description: requiredStringSchema.max(10000, 'Description must be less than 10000 characters'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  visibility: z.enum(['department', 'all']).default('department'),
});

export const updateReportSchema = z.object({
  title: requiredStringSchema.max(200, 'Title must be less than 200 characters').optional(),
  description: requiredStringSchema.max(10000, 'Description must be less than 10000 characters').optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
});

export const reviewReportSchema = z.object({
  status: z.enum(['under_review', 'reviewed', 'rejected']),
  notes: z.string().max(2000, 'Notes must be less than 2000 characters').optional(),
});

