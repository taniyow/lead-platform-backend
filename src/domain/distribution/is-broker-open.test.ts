import { DateTime } from 'luxon';
import { describe, expect, it } from 'vitest';
import { BrokerSchedule, isBrokerOpen } from './is-broker-open';

const WEEKDAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

function instant(zone: string, parts: { year: number; month: number; day: number; hour: number; minute?: number }): Date {
  return DateTime.fromObject(parts, { zone }).toUTC().toJSDate();
}

const manilaBroker: BrokerSchedule = {
  timezone: 'Asia/Manila',
  openingTime: '09:00',
  closingTime: '18:00',
  workingDays: WEEKDAYS,
};

// 2026-09-02 is a Wednesday, 2026-09-05 a Saturday, 2026-09-07 a Monday.
describe('isBrokerOpen - same-day window', () => {
  it('is open during working hours on a working day', () => {
    expect(
      isBrokerOpen(manilaBroker, instant('Asia/Manila', { year: 2026, month: 9, day: 2, hour: 10 })),
    ).toBe(true);
  });

  it('is open exactly at opening time (inclusive)', () => {
    expect(
      isBrokerOpen(manilaBroker, instant('Asia/Manila', { year: 2026, month: 9, day: 2, hour: 9, minute: 0 })),
    ).toBe(true);
  });

  it('is closed just before opening time', () => {
    expect(
      isBrokerOpen(manilaBroker, instant('Asia/Manila', { year: 2026, month: 9, day: 2, hour: 8, minute: 59 })),
    ).toBe(false);
  });

  it('is closed exactly at closing time (exclusive)', () => {
    expect(
      isBrokerOpen(manilaBroker, instant('Asia/Manila', { year: 2026, month: 9, day: 2, hour: 18, minute: 0 })),
    ).toBe(false);
  });

  it('is open just before closing time', () => {
    expect(
      isBrokerOpen(manilaBroker, instant('Asia/Manila', { year: 2026, month: 9, day: 2, hour: 17, minute: 59 })),
    ).toBe(true);
  });

  it('is closed on a non-working day even inside the window', () => {
    expect(
      isBrokerOpen(manilaBroker, instant('Asia/Manila', { year: 2026, month: 9, day: 5, hour: 10 })),
    ).toBe(false);
  });
});

describe('isBrokerOpen - timezone conversion', () => {
  it('evaluates the same UTC instant differently per broker timezone', () => {
    // 2026-09-02T14:00Z = 10:00 in New York (open) but 22:00 in Manila (closed).
    const nowUtc = new Date(Date.UTC(2026, 8, 2, 14, 0));
    const newYorkBroker: BrokerSchedule = { ...manilaBroker, timezone: 'America/New_York' };

    expect(isBrokerOpen(newYorkBroker, nowUtc)).toBe(true);
    expect(isBrokerOpen(manilaBroker, nowUtc)).toBe(false);
  });

  it('returns false for an invalid timezone instead of throwing', () => {
    const broken: BrokerSchedule = { ...manilaBroker, timezone: 'Not/AZone' };
    expect(isBrokerOpen(broken, new Date())).toBe(false);
  });
});

describe('isBrokerOpen - overnight window', () => {
  const nightShift: BrokerSchedule = {
    timezone: 'Asia/Manila',
    openingTime: '22:00',
    closingTime: '06:00',
    workingDays: ['MONDAY'],
  };

  it('is open in the evening segment of a working day', () => {
    expect(
      isBrokerOpen(nightShift, instant('Asia/Manila', { year: 2026, month: 9, day: 7, hour: 23 })),
    ).toBe(true);
  });

  it("is open after midnight as part of the previous working day's shift", () => {
    expect(
      isBrokerOpen(nightShift, instant('Asia/Manila', { year: 2026, month: 9, day: 8, hour: 3 })),
    ).toBe(true);
  });

  it('is closed in the evening of a non-working day', () => {
    expect(
      isBrokerOpen(nightShift, instant('Asia/Manila', { year: 2026, month: 9, day: 8, hour: 23 })),
    ).toBe(false);
  });

  it('is closed outside the window on a working day', () => {
    expect(
      isBrokerOpen(nightShift, instant('Asia/Manila', { year: 2026, month: 9, day: 7, hour: 12 })),
    ).toBe(false);
  });
});
