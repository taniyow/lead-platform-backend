/**
 * The assessment's required normalization: email.trim().toLowerCase().
 * Duplicate detection always compares normalized values.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
