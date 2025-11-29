import { z } from 'zod';
import { uuidSchema, requiredStringSchema } from './common';

/**
 * Memo validation schemas
 */

export const sendMemoSchema = z.object({
  recipientType: z.enum(['department', 'staff', 'all']),
  recipientId: z.string().optional(),
  subject: requiredStringSchema.max(200, 'Subject must be less than 200 characters'),
  body: requiredStringSchema.max(5000, 'Message must be less than 5000 characters'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
}).refine((data) => {
  if (data.recipientType !== 'all' && !data.recipientId) {
    return false;
  }
  return true;
}, {
  message: 'Recipient is required',
  path: ['recipientId'],
});

export const replyMemoSchema = z.object({
  message: requiredStringSchema.max(5000, 'Message must be less than 5000 characters'),
});

