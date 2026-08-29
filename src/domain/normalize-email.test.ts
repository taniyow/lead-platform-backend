import { describe, expect, it } from 'vitest';
import { normalizeEmail } from './normalize-email';

describe('normalizeEmail', () => {
  it('lowercases uppercase characters', () => {
    expect(normalizeEmail('USER@EXAMPLE.COM')).toBe('user@example.com');
  });

  it('trims surrounding whitespace', () => {
    expect(normalizeEmail('  user@example.com  ')).toBe('user@example.com');
  });

  it('handles mixed case and whitespace together', () => {
    expect(normalizeEmail(' Alice@Example.COM ')).toBe('alice@example.com');
  });

  it('leaves an already-normalized email unchanged', () => {
    expect(normalizeEmail('user@example.com')).toBe('user@example.com');
  });
});
