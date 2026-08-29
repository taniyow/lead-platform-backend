import { DateTime } from 'luxon';

// Luxon weekday: 1 = Monday ... 7 = Sunday
const WEEKDAY_NAMES = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const;

export interface BrokerSchedule {
  timezone: string;
  openingTime: string; // HH:mm
  closingTime: string; // HH:mm
  workingDays: string[];
}

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * A broker is open when, in its own timezone, the current time falls inside
 * the [opening, closing) window on a working day.
 *
 * Overnight windows (closing < opening, e.g. 22:00-06:00) are supported: the
 * evening segment belongs to the working day it starts on, and the after-
 * midnight segment is treated as part of that same shift - it counts against
 * the previous day's working-day flag.
 */
export function isBrokerOpen(schedule: BrokerSchedule, nowUtc: Date): boolean {
  const local = DateTime.fromJSDate(nowUtc, { zone: 'utc' }).setZone(schedule.timezone);
  if (!local.isValid) {
    return false;
  }

  const weekday = WEEKDAY_NAMES[local.weekday - 1];
  const nowMinutes = local.hour * 60 + local.minute;
  const open = toMinutes(schedule.openingTime);
  const close = toMinutes(schedule.closingTime);

  if (open < close) {
    return schedule.workingDays.includes(weekday) && nowMinutes >= open && nowMinutes < close;
  }

  // Overnight window.
  if (nowMinutes >= open) {
    return schedule.workingDays.includes(weekday);
  }
  if (nowMinutes < close) {
    const previousWeekday = WEEKDAY_NAMES[(local.weekday + 5) % 7];
    return schedule.workingDays.includes(previousWeekday);
  }
  return false;
}
