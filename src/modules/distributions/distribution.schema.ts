import { z } from 'zod';

export const distributionIdSchema = z.coerce.number().int().positive();

export const configureBrokersSchema = z.object({
  brokers: z
    .array(
      z.object({
        brokerId: z.number().int().positive(),
        percentage: z
          .number()
          .min(0, 'Percentage cannot be negative')
          .max(100, 'Percentage cannot exceed 100'),
        active: z.boolean(),
      }),
    )
    .refine(
      (brokers) => new Set(brokers.map((b) => b.brokerId)).size === brokers.length,
      'Each broker can only appear once',
    ),
});

export type ConfigureBrokersInput = z.infer<typeof configureBrokersSchema>;
