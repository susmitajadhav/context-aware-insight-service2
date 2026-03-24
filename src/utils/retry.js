// =========================
// FILE: src/utils/retry.js
// =========================

import { AIServiceError } from '../errors/AIServiceError.js';
import { logger } from './logger.js';

export const retry = async (fn, retries, delay) => {
  let attempt = 0;
  let lastError = null;

  while (attempt <= retries) {
    try {
      return await fn();

    } catch (err) {
      lastError = err;

      // =========================
      // Retry ONLY AI errors
      // =========================
      if (!(err instanceof AIServiceError)) {
        throw err;
      }

      // =========================
      // Retries exhausted
      // =========================
      if (attempt === retries) {
        logger.error({
          event: 'RETRY_EXHAUSTED',
          attempts: attempt,
          error: err.message,
          errorType: err.type,
        });

        err.retryCount = attempt;
        throw err;
      }

      const backoffDelay = delay * Math.pow(2, attempt);

      logger.warn({
        event: 'RETRY_ATTEMPT',
        attempt,
        nextDelayMs: backoffDelay,
        error: err.message,
        errorType: err.type,
      });

      await new Promise((res) => setTimeout(res, backoffDelay));

      attempt++;
    }
  }

  // =========================
  // Fallback (should not hit)
  // =========================
  if (lastError) {
    lastError.retryCount = attempt;
    throw lastError;
  }

  throw new Error('Retry failed unexpectedly');
};