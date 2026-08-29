import { describe, expect, it } from 'vitest';
import { getBrokerDayRange } from './get-broker-day-range';

const HOUR = 3600 * 1000;

describe('getBrokerDayRange', () => {
  it('returns the broker-local calendar day as a UTC interval', () => {
    // 10:00 on 2026-09-02 in Manila (UTC+8) -> local day is Sep 2.
    const nowUtc = new Date(Date.UTC(2026, 8, 2, 2, 0));
    const range = getBrokerDayRange('Asia/Manila', nowUtc);

    expect(range.start.toISOString()).toBe('2026-09-01T16:00:00.000Z'); // Sep 2, 00:00 +08
    expect(range.end.toISOString()).toBe('2026-09-02T16:00:00.000Z');
    expect(range.end.getTime() - range.start.getTime()).toBe(24 * HOUR);
  });

  it('spans 25 hours on the day daylight saving time ends', () => {
    // DST ends in America/New_York on 2026-11-01: the local day has 25 hours.
    const nowUtc = new Date(Date.UTC(2026, 10, 1, 12, 0));
    const range = getBrokerDayRange('America/New_York', nowUtc);

    expect(range.start.toISOString()).toBe('2026-11-01T04:00:00.000Z'); // 00:00 EDT
    expect(range.end.toISOString()).toBe('2026-11-02T05:00:00.000Z'); // 00:00 EST next day
    expect(range.end.getTime() - range.start.getTime()).toBe(25 * HOUR);
  });

  it('uses the correct local day near midnight boundaries', () => {
    // 2026-09-02T17:00Z is already 01:00 on Sep 3 in Manila.
    const nowUtc = new Date(Date.UTC(2026, 8, 2, 17, 0));
    const range = getBrokerDayRange('Asia/Manila', nowUtc);

    expect(range.start.toISOString()).toBe('2026-09-02T16:00:00.000Z'); // Sep 3, 00:00 +08
    expect(range.end.toISOString()).toBe('2026-09-03T16:00:00.000Z');
  });
});
