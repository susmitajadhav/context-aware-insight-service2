// =========================
// FILE: src/services/insightService.js
// =========================

import { getTenantContext } from '../repositories/contextRepository.js';
import { callAI } from './aiService.js';
import { retry } from '../utils/retry.js';
import { logger } from '../utils/logger.js';
import { saveQueryLog } from '../repositories/queryRepository.js';
import { config } from '../config/index.js';
import { AppError } from '../errors/AppError.js';

// =========================
// Cache imports
// =========================
import {
  getCache,
  setCache,
  generateCacheKey,
} from '../utils/cache.js';

/**
 * Core business logic: Create insight
 */
export const createInsight = async ({
  tenantId,
  queryText,
  requestId,
}) => {
  const start = Date.now();

  const reqId =
    requestId ||
    `req-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  // =========================
  // 1. Input validation
  // =========================
  if (!tenantId || typeof tenantId !== 'string') {
    throw new AppError('Invalid tenantId', 400, 'INVALID_INPUT');
  }

  if (!queryText || typeof queryText !== 'string') {
    throw new AppError('Invalid queryText', 400, 'INVALID_INPUT');
  }

  const normalizedTenantId = tenantId.trim();
  const normalizedQueryText = queryText.trim();

  const cacheKey = generateCacheKey({
    tenantId: normalizedTenantId,
    queryText: normalizedQueryText,
  });

  try {
    // =========================
    // 2. CHECK CACHE
    // =========================
    const cached = getCache(cacheKey);

    if (cached) {
      const latency = Date.now() - start;

      logger.info({
        requestId: reqId,
        event: 'CACHE_HIT',
        tenantId: normalizedTenantId,
      });

      logger.info({
        requestId: reqId,
        event: 'CACHE_RETURN',
        tenantId: normalizedTenantId,
        latencyMs: latency,
      });

      return {
        ...cached,
        cached: true,
        latencyMs: latency,
      };
    }

    logger.info({
      requestId: reqId,
      event: 'CACHE_MISS',
      tenantId: normalizedTenantId,
    });

    // =========================
    // 3. Fetch Context
    // =========================
    logger.info({
      requestId: reqId,
      event: 'CONTEXT_FETCH_START',
      tenantId: normalizedTenantId,
    });

    const context = await getTenantContext(normalizedTenantId);

    // =========================
    // 3.1 Validate Context Exists
    // =========================
    if (!context) {
      logger.warn({
        requestId: reqId,
        event: 'CONTEXT_NOT_FOUND',
        tenantId: normalizedTenantId,
      });

      throw new AppError(
        `No context found for tenant: ${normalizedTenantId}`,
        404,
        'CONTEXT_NOT_FOUND'
      );
    }

    logger.info({
      requestId: reqId,
      event: 'CONTEXT_FETCH_SUCCESS',
      tenantId: normalizedTenantId,
    });

    // =========================
    // 4. Call AI (with retry)
    // =========================
    logger.info({
      requestId: reqId,
      event: 'AI_CALL_START',
      tenantId: normalizedTenantId,
    });

    const insight = await retry(
      async () =>
        await callAI({
          queryText: normalizedQueryText,
          context,
          requestId: reqId,
        }),
      config.ai.retryCount,
      config.ai.retryDelay
    );

    logger.info({
      requestId: reqId,
      event: 'AI_CALL_SUCCESS',
      tenantId: normalizedTenantId,
    });

    const latency = Date.now() - start;

    const response = {
      status: 'SUCCESS',
      insight,
    };

    // =========================
    // 5. STORE IN CACHE (ONLY SUCCESS)
    // =========================
    setCache(cacheKey, response);

    // =========================
    // 6. Save SUCCESS log (DB)
    // =========================
    await safeLog({
      tenantId: normalizedTenantId,
      queryText: normalizedQueryText,
      response: insight,
      status: 'SUCCESS',
      latency,
      requestId: reqId,
    });

    // =========================
    // 7. Return response
    // =========================
    return {
      ...response,
      cached: false,
      latencyMs: latency,
    };

  } catch (error) {
    const latency = Date.now() - start;

    logger.error({
      requestId: reqId,
      tenantId: normalizedTenantId,
      event: 'INSIGHT_FAILED',
      error: error.message,
      errorType: error.type,
      errorCode: error.code || 'UNKNOWN_ERROR',
      latencyMs: latency,
    });

    // =========================
    // 8. Save FAILURE log (DB)
    // =========================
    await safeLog({
      tenantId: normalizedTenantId,
      queryText: normalizedQueryText,
      response: error.message,
      status: 'FAILURE',
      latency,
      requestId: reqId,
    });

    // 🔥 PRESERVE METADATA FOR CONTROLLER
    if (error.type) {
      error.retryCount = error.retryCount || config.ai.retryCount;
      throw error;
    }

    throw error;
  }
};


// =========================
// Helper: Safe Logging Wrapper
// =========================

const safeLog = async ({
  tenantId,
  queryText,
  response,
  status,
  latency,
  requestId,
}) => {
  try {
    await saveQueryLog({
      tenantId,
      queryText,
      response,
      latency,
      status,
    });
  } catch (err) {
    logger.error({
      requestId,
      event: 'LOGGING_FAILED',
      error: err.message,
    });
  }
};