export interface RetryOptions {
  retries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

export async function withRetries<T>(
  fn: () => Promise<T>,
  options: RetryOptions,
): Promise<T> {
  let attempt = 0;
  let lastError: unknown;
  while (attempt <= options.retries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const delay = Math.min(options.baseDelayMs * 2 ** attempt, options.maxDelayMs);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    attempt += 1;
  }
  throw lastError;
}
