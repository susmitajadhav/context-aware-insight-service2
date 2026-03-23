// =========================
// FILE: src/utils/retry.js


import { AIServiceError } from '../errors/AIServiceError.js';
import { logger } from './logger.js';

export const retry = async (fn, retries, delay) => {
  let attempt = 0;

  while (attempt <= retries) {
    try {
      return await fn();
    } catch (err) {
      // Retry ONLY AI errors
      if (!(err instanceof AIServiceError)) {
        throw err;
      }

      if (attempt === retries) {
        logger.error({
          event: 'RETRY_EXHAUSTED',
          attempts: attempt,
          error: err.message,
        });
        throw err;
      }

      logger.warn({
        event: 'RETRY_ATTEMPT',
        attempt,
        delayMs: delay * Math.pow(2, attempt),
      });

      await new Promise((res) =>
        setTimeout(res, delay * Math.pow(2, attempt))
      );

      attempt++;
    }
  }
};