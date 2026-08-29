import { z } from 'zod';

export const formSlugSchema = z.string().trim().toLowerCase().min(1).max(100);

export const leadIdSchema = z.coerce.number().int().positive();

export const publicLeadSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(191),
  email: z.email('Enter a valid email address').max(191),
  phone: z
    .string()
    .trim()
    .min(5, 'Enter a valid phone number')
    .max(32)
    .regex(/^\+?[0-9()\-\s.]+$/, 'Enter a valid phone number'),
});

export type PublicLeadInput = z.infer<typeof publicLeadSchema>;

export const manualAssignSchema = z.object({
  brokerId: z.number().int().positive(),
});

export type ManualAssignInput = z.infer<typeof manualAssignSchema>;
