/**
 * Generic async retry utility with exponential backoff.
 * Handles 429 rate-limit responses by respecting the server's suggested retry delay.
 */

import { logger } from "./logger.js";

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelayMs: 2000,
  maxDelayMs: 60000,
};

/**
 * Extracts a retry delay (in ms) from a 429 error if available.
 */
function extractRetryDelay(error: unknown): number | null {
  if (
    error &&
    typeof error === "object" &&
    "errorDetails" in error &&
    Array.isArray((error as Record<string, unknown>).errorDetails)
  ) {
    const details = (error as Record<string, unknown>).errorDetails as Array<
      Record<string, unknown>
    >;
    for (const detail of details) {
      if (
        detail["@type"] === "type.googleapis.com/google.rpc.RetryInfo" &&
        typeof detail.retryDelay === "string"
      ) {
        const seconds = parseFloat(detail.retryDelay);
        if (!isNaN(seconds)) {
          return Math.ceil(seconds * 1000);
        }
      }
    }
  }
  return null;
}

/**
 * Checks if the error is a rate-limit (429) error.
 */
function isRateLimitError(error: unknown): boolean {
  if (error && typeof error === "object" && "status" in error) {
    return (error as Record<string, unknown>).status === 429;
  }
  return false;
}

/**
 * Wraps an async function with automatic retry and exponential backoff.
 * For 429 errors, respects the server's suggested retry delay.
 *
 * @param fn - The async function to execute
 * @param label - A descriptive label for logging
 * @param options - Retry configuration
 * @returns The result of the function
 * @throws The last error if all attempts fail
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  options?: RetryOptions,
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isLastAttempt = attempt === opts.maxAttempts;

      if (isLastAttempt) {
        logger.error(
          `[${label}] All ${opts.maxAttempts} attempts failed. Giving up.`,
          error,
        );
        throw error;
      }

      // For 429 errors, use the server-suggested delay if available
      let delay: number;
      if (isRateLimitError(error)) {
        const serverDelay = extractRetryDelay(error);
        delay = serverDelay || opts.baseDelayMs * Math.pow(2, attempt);
        logger.warn(
          `[${label}] Rate limited (429). Waiting ${Math.round(delay / 1000)}s before retry ${attempt + 1}/${opts.maxAttempts}...`,
        );
      } else {
        delay = Math.min(
          opts.baseDelayMs * Math.pow(2, attempt - 1),
          opts.maxDelayMs,
        );
        logger.warn(
          `[${label}] Attempt ${attempt}/${opts.maxAttempts} failed. Retrying in ${delay}ms...`,
          error instanceof Error ? error.message : error,
        );
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error(`[${label}] Retry logic exhausted unexpectedly`);
}
