/**
 * lib/retry.ts
 *
 * Exponential backoff with full jitter for external API calls.
 *
 * The jitter formula (0.5 + Math.random() * 0.5) produces values in [0.5, 1.0]
 * range — "full jitter" per AWS's retry guidance. This prevents the thundering
 * herd problem when many proxy requests fail simultaneously and all retry at the
 * same time.
 *
 * 429 handling: reads X-RateLimit-Reset (seconds until window reset) and waits
 * until that timestamp rather than using exponential backoff, which could still
 * fire before the rate limit window resets.
 */

export interface RetryOptions {
  /** Maximum number of attempts (including the first). Default: 3 */
  maxAttempts: number;
  /** Base delay in ms before jitter is applied. Default: 500 */
  baseDelayMs: number;
  /** Maximum delay cap in ms. Default: 10000 */
  maxDelayMs: number;
  /** HTTP status codes that should trigger a retry. Default: [500, 503] */
  retryOn: number[];
}

export class FetchError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'FetchError';
  }
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  baseDelayMs: 500,
  maxDelayMs: 10_000,
  retryOn: [500, 503],
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function computeBackoffDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number
): number {
  // Exponential growth capped at maxDelayMs, then jittered to [50%, 100%]
  const exponential = baseDelayMs * Math.pow(2, attempt);
  const capped = Math.min(exponential, maxDelayMs);
  const jitter = 0.5 + Math.random() * 0.5;
  return Math.floor(capped * jitter);
}

/**
 * Fetch with exponential backoff and jitter.
 *
 * @throws FetchError on final failure with the last response status and message
 */
export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  options?: Partial<RetryOptions>
): Promise<Response> {
  const opts: RetryOptions = { ...DEFAULT_OPTIONS, ...options };
  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt < opts.maxAttempts; attempt++) {
    let response: Response;

    try {
      response = await fetch(url, init);
    } catch (networkError) {
      // Network-level failure (DNS, timeout, etc.) — always retry
      if (attempt < opts.maxAttempts - 1) {
        const delay = computeBackoffDelay(attempt, opts.baseDelayMs, opts.maxDelayMs);
        await sleep(delay);
        continue;
      }
      throw new FetchError(0, `Network error: ${String(networkError)}`);
    }

    if (response.ok) {
      return response;
    }

    lastResponse = response;

    // 429: respect the server's rate-limit reset timestamp rather than guessing
    if (response.status === 429) {
      const resetHeader = response.headers.get('X-RateLimit-Reset');
      if (resetHeader) {
        const resetSeconds = parseInt(resetHeader, 10);
        if (!Number.isNaN(resetSeconds)) {
          // resetSeconds is seconds-until-reset (relative), not an epoch timestamp
          const waitMs = resetSeconds * 1000 + 200; // +200ms buffer
          await sleep(Math.min(waitMs, opts.maxDelayMs));
          continue;
        }
      }
      // No header — fall through to exponential backoff
    }

    const shouldRetry = opts.retryOn.includes(response.status);
    if (!shouldRetry || attempt >= opts.maxAttempts - 1) {
      break;
    }

    const delay = computeBackoffDelay(attempt, opts.baseDelayMs, opts.maxDelayMs);
    await sleep(delay);
  }

  const status = lastResponse?.status ?? 0;
  const message = lastResponse
    ? `Request failed with status ${status}`
    : 'Request failed';

  throw new FetchError(status, message);
}
