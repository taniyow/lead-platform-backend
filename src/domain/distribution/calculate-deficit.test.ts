import { describe, expect, it } from 'vitest';
import { calculateDeficit } from './calculate-deficit';

describe('calculateDeficit', () => {
  // The assessment's worked example: totalSentToday = 10.
  it('matches the assessment example for broker A (50%, 4 sent)', () => {
    expect(calculateDeficit(10, 50, 4)).toBeCloseTo(1.5, 10);
  });

  it('matches the assessment example for broker B (30%, 3 sent)', () => {
    expect(calculateDeficit(10, 30, 3)).toBeCloseTo(0.3, 10);
  });

  it('matches the assessment example for broker C (20%, 3 sent)', () => {
    expect(calculateDeficit(10, 20, 3)).toBeCloseTo(-0.8, 10);
  });

  it('gives a fresh 100% broker a deficit of exactly one lead', () => {
    expect(calculateDeficit(0, 100, 0)).toBe(1);
  });

  it('gives a 0% broker no positive deficit', () => {
    expect(calculateDeficit(10, 0, 0)).toBe(0);
  });

  it('goes negative when a broker is above its target share', () => {
    expect(calculateDeficit(10, 10, 5)).toBeCloseTo(-3.9, 10);
  });
});
