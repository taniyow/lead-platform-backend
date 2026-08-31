import { DateTime } from 'luxon';

export interface UtcRange {
  start: Date;
  end: Date;
}

/**
 * The broker's current local calendar day expressed as a UTC interval, used to
 * count leads for the daily cap. Handles DST transitions because Luxon derives
 * the local midnight boundaries within the broker's own zone.
 */
export function getBrokerDayRange(timezone: string, nowUtc: Date): UtcRange {
  const local = DateTime.fromJSDate(nowUtc, { zone: 'utc' }).setZone(timezone);
  const startOfDay = local.startOf('day');
  const endOfDay = startOfDay.plus({ days: 1 });
  return {
    start: startOfDay.toUTC().toJSDate(),
    end: endOfDay.toUTC().toJSDate(),
  };
}
