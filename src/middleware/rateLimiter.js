
// FILE: src/middleware/rateLimiter.js


import { logger } from '../utils/logger.js';

/**
 * In-memory rate limiter (per tenant)
 */

const rateLimitStore = new Map();

/**
 * Config
 */
const WINDOW_SIZE_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 5; // per tenant per window

export const rateLimiter = (req, res, next) => {
  const tenantId = req.body?.tenantId;

  // Skip if no tenantId (validation will handle later)
  if (!tenantId) {
    return next();
  }

  const now = Date.now();

  if (!rateLimitStore.has(tenantId)) {
    rateLimitStore.set(tenantId, []);
  }

  const timestamps = rateLimitStore.get(tenantId);

  // Remove old timestamps
  const validTimestamps = timestamps.filter(
    (ts) => now - ts < WINDOW_SIZE_MS
  );

  // Add current request
  validTimestamps.push(now);

  rateLimitStore.set(tenantId, validTimestamps);

  // Check limit
  if (validTimestamps.length > MAX_REQUESTS) {
    logger.warn({
      event: 'RATE_LIMIT_EXCEEDED',
      tenantId,
      count: validTimestamps.length,
    });

    return res.status(429).json({
      status: 'error',
      message: 'Too many requests, please try again later',
      requestId: req.requestId,
    });
  }

  next();
};