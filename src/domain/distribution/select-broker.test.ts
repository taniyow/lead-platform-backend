import { describe, expect, it } from 'vitest';
import { selectBroker } from './select-broker';

describe('selectBroker', () => {
  it('returns null when no broker is eligible', () => {
    expect(selectBroker([], 10)).toBeNull();
  });

  it('returns the only candidate when one broker is eligible', () => {
    const only = { brokerId: 7, percentage: 30, sentToday: 2 };
    expect(selectBroker([only], 5)).toBe(only);
  });

  it('picks the highest deficit (assessment worked example: A wins)', () => {
    const a = { brokerId: 1, percentage: 50, sentToday: 4 }; // deficit +1.5
    const b = { brokerId: 2, percentage: 30, sentToday: 3 }; // deficit +0.3
    const c = { brokerId: 3, percentage: 20, sentToday: 3 }; // deficit -0.8
    expect(selectBroker([a, b, c], 10)).toBe(a);
  });

  it('breaks a deficit tie by fewer sent leads today', () => {
    // totalSentToday = 9 -> targets: A = 10*50/100 = 5, B = 10*40/100 = 4.
    // Deficits: A = 5 - 3 = 2, B = 4 - 2 = 2. B has fewer sent -> B wins.
    const a = { brokerId: 1, percentage: 50, sentToday: 3 };
    const b = { brokerId: 2, percentage: 40, sentToday: 2 };
    expect(selectBroker([a, b], 9)).toBe(b);
  });

  it('breaks a full tie deterministically by lowest broker id', () => {
    const higherId = { brokerId: 5, percentage: 30, sentToday: 1 };
    const lowerId = { brokerId: 2, percentage: 30, sentToday: 1 };
    expect(selectBroker([higherId, lowerId], 4)).toBe(lowerId);
  });

  it('is order-independent for the id tie-break', () => {
    const higherId = { brokerId: 5, percentage: 30, sentToday: 1 };
    const lowerId = { brokerId: 2, percentage: 30, sentToday: 1 };
    expect(selectBroker([lowerId, higherId], 4)).toBe(lowerId);
  });

  it('lets a behind broker win even with a smaller percentage', () => {
    // A (60%) is already over target; B (20%) has received nothing.
    // totalSentToday = 5 -> A target 3.6, deficit -1.4; B target 1.2, deficit +1.2.
    const a = { brokerId: 1, percentage: 60, sentToday: 5 };
    const b = { brokerId: 2, percentage: 20, sentToday: 0 };
    expect(selectBroker([a, b], 5)).toBe(b);
  });
});
