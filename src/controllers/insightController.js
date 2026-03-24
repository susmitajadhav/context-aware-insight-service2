// =========================
// FILE: src/controllers/insightController.js
// =========================

import { createInsight } from '../services/insightService.js';
import { logger } from '../utils/logger.js';
import { insightSchema } from '../validators/insightValidator.js';
import { config } from '../config/index.js';

export const createInsightController = async (req, res) => {
  const requestId = req.requestId;

  // =========================
  // Request log
  // =========================
  logger.info({
    requestId,
    event: 'REQUEST_RECEIVED',
    path: req.originalUrl,
    method: req.method,
    body: req.body,
  });

  // =========================
  // Validation
  // =========================
  const { error, value } = insightSchema.validate(req.body);

  if (error) {
    logger.warn({
      requestId,
      event: 'VALIDATION_FAILED',
      error: error.details[0].message,
    });

    return res.status(400).json({
      status: 'error',
      message: error.details[0].message,
      requestId,
    });
  }

  const { tenantId, queryText } = value;

  try {
    // =========================
    // Call service
    // =========================
    const result = await createInsight({
      tenantId,
      queryText,
      requestId,
    });

    logger.info({
      requestId,
      event: 'REQUEST_SUCCESS',
      tenantId,
      latencyMs: result.latencyMs,
    });

    return res.status(200).json({
      ...result,
      requestId,
    });

  } catch (error) {
    logger.error({
      requestId,
      event: 'REQUEST_FAILED',
      tenantId,
      error: error.message,
      errorType: error.type,
      errorCode: error.code || 'UNKNOWN_ERROR',
    });

    // =========================
    // TIMEOUT ERROR
    // =========================
    if (error.type === 'TIMEOUT') {
      return res.status(502).json({
        status: 'error',
        message: 'AI request timed out after retries',
        meta: {
          type: 'TIMEOUT',
          timeoutMs: error.timeoutMs,
          retryCount: error.retryCount ?? config.ai.retryCount,
        },
        requestId,
      });
    }

    // =========================
    // CIRCUIT BREAKER
    // =========================
    if (error.type === 'BREAKER_OPEN') {
      return res.status(503).json({
        status: 'error',
        message: 'AI circuit breaker is open',
        meta: {
          type: 'BREAKER_OPEN',
        },
        requestId,
      });
    }

    // =========================
    // AI FAILURE
    // =========================
    if (error.type === 'AI_FAILURE') {
      return res.status(502).json({
        status: 'error',
        message: 'AI service returned an error',
        meta: {
          type: 'AI_FAILURE',
          statusCode: error.statusCode,
          retryCount: error.retryCount ?? config.ai.retryCount,
        },
        requestId,
      });
    }

    // =========================
    // NETWORK ERROR
    // =========================
    if (error.type === 'NETWORK_ERROR') {
      return res.status(502).json({
        status: 'error',
        message: 'AI service unreachable',
        meta: {
          type: 'NETWORK_ERROR',
        },
        requestId,
      });
    }

    // =========================
    // INVALID RESPONSE
    // =========================
    if (error.type === 'INVALID_RESPONSE') {
      return res.status(502).json({
        status: 'error',
        message: 'Invalid response from AI service',
        meta: {
          type: 'INVALID_RESPONSE',
        },
        requestId,
      });
    }

    // =========================
    // Known fallback
    // =========================
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        status: 'error',
        message: error.message,
        requestId,
      });
    }

    // =========================
    // Unknown fallback
    // =========================
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      requestId,
    });
  }
};