import { z } from 'zod';

export const WEEK_DAYS = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const;

export type WeekDay = (typeof WEEK_DAYS)[number];

const SUPPORTED_TIMEZONES = new Set<string>(Intl.supportedValuesOf('timeZone'));

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Must be a valid time in HH:mm format');

const brokerFields = {
  name: z.string().trim().min(1, 'Name is required').max(191),
  active: z.boolean(),
  dailyCap: z.number().int('Daily cap must be a whole number').min(0, 'Daily cap cannot be negative'),
  timezone: z
    .string()
    .refine((tz) => SUPPORTED_TIMEZONES.has(tz), 'Must be a valid IANA timezone'),
  openingTime: timeSchema,
  closingTime: timeSchema,
  workingDays: z
    .array(z.enum(WEEK_DAYS))
    .min(1, 'At least one working day is required')
    .refine((days) => new Set(days).size === days.length, 'Working days must be unique'),
};

export const createBrokerSchema = z
  .object({
    ...brokerFields,
    active: brokerFields.active.default(true),
  })
  .refine((value) => value.openingTime !== value.closingTime, {
    message: 'Opening and closing time cannot be equal',
    path: ['closingTime'],
  });

export const updateBrokerSchema = z.object(brokerFields).partial();

export const brokerIdSchema = z.coerce.number().int().positive();

export type CreateBrokerInput = z.infer<typeof createBrokerSchema>;
export type UpdateBrokerInput = z.infer<typeof updateBrokerSchema>;
