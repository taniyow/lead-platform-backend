import { Prisma } from '@prisma/client';

// P2034: transaction write conflict or deadlock. Serializable transactions are
// expected to occasionally fail this way under concurrency; retrying is the
// standard remedy.
const RETRYABLE_CODES = new Set(['P2034']);

export async function withSerializableRetry<T>(
  operation: () => Promise<T>,
  maxAttempts = 3,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err;
      const retryable =
        err instanceof Prisma.PrismaClientKnownRequestError && RETRYABLE_CODES.has(err.code);
      if (!retryable || attempt === maxAttempts) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 25 * attempt));
    }
  }
  throw lastError;
}
