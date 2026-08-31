import { z } from 'zod';

// Slugs that would collide with admin routes or Next.js internals if used
// as the public form URL.
export const RESERVED_SLUGS = new Set([
  'api',
  'login',
  'dashboard',
  'brokers',
  'form',
  'distribution',
  'leads',
  '_next',
  'favicon.ico',
]);

export const createFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(191),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Slug is required')
    .max(100)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug may only contain lowercase letters, numbers, and hyphens',
    )
    .refine((slug) => !RESERVED_SLUGS.has(slug), 'This slug is reserved'),
});

export type CreateFormInput = z.infer<typeof createFormSchema>;
