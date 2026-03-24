// =========================
// FILE: src/services/aiService.js
// =========================

import axios from 'axios';
import CircuitBreaker from 'opossum';

import { logger } from '../utils/logger.js';
import { AIServiceError } from '../errors/AIServiceError.js';
import { config } from '../config/index.js';


// =========================
// Axios Instance
// =========================

const aiClient = axios.create({
  baseURL: config.ai.url,
  timeout: config.ai.timeoutMs,
  headers: {
    'Content-Type': 'application/json',
  },
});


// =========================
// Core AI HTTP Call
// =========================

const aiHttpCall = async ({ queryText, context, requestId }) => {
  const start = Date.now();

  try {
    const response = await aiClient.post('', {
      queryText,
      context,
    });

    const latency = Date.now() - start;

    logger.info({
      requestId,
      event: 'AI_HTTP_SUCCESS',
      latencyMs: latency,
    });

    if (!response.data || !response.data.insight) {
      const err = new AIServiceError('Invalid AI response format');
      err.type = 'INVALID_RESPONSE';
      throw err;
    }

    return response.data.insight;

  } catch (error) {
    const latency = Date.now() - start;

    logger.error({
      requestId,
      event: 'AI_HTTP_FAILED',
      latencyMs: latency,
      error: error.message,
    });

    // =========================
    // TIMEOUT CASE (robust)
    // =========================
    if (
      error.code === 'ECONNABORTED' ||
      error.message?.toLowerCase().includes('timeout')
    ) {
      const err = new AIServiceError('AI request timed out');
      err.type = 'TIMEOUT';
      err.timeoutMs = config.ai.timeoutMs;
      throw err;
    }

    // =========================
    // AI RESPONDED WITH ERROR
    // =========================
    if (error.response) {
      const err = new AIServiceError(
        `AI service responded with status ${error.response.status}`
      );
      err.type = 'AI_FAILURE';
      err.statusCode = error.response.status;
      throw err;
    }

    // =========================
    // NETWORK FAILURE
    // =========================
    const err = new AIServiceError('AI service unavailable');
    err.type = 'NETWORK_ERROR';
    throw err;
  }
};


// =========================
// Circuit Breaker Setup
// =========================

const breaker = new CircuitBreaker(aiHttpCall, {
  timeout: config.ai.timeoutMs + 500, // 👈 KEY FIX
  errorThresholdPercentage: 100,
  resetTimeout: 5000,
});

// =========================
// Circuit Breaker Events
// =========================

breaker.on('open', () => {
  logger.warn({ event: 'CIRCUIT_OPEN' });
});

breaker.on('halfOpen', () => {
  logger.warn({ event: 'CIRCUIT_HALF_OPEN' });
});

breaker.on('close', () => {
  logger.info({ event: 'CIRCUIT_CLOSED' });
});


// =========================
// Public Function
// =========================

export const callAI = async ({ queryText, context, requestId }) => {
  try {
    return await breaker.fire({ queryText, context, requestId });

  } catch (error) {
  logger.error({
    requestId,
    event: 'AI_CALL_FAILED',
    error: error.message,
    type: error.type,
  });

  // 🔥 HANDLE CIRCUIT BREAKER
  if (error.code === 'EOPENBREAKER') {
    const err = new AIServiceError('AI circuit breaker is open');
    err.type = 'BREAKER_OPEN';
    throw err;
  }

  // 🔥 HANDLE OPOSSUM WRAPPED ERROR
  if (error.originalError && error.originalError.type) {
    throw error.originalError;
  }

  // 🔥 DIRECT ERROR (normal case)
  if (error.type) {
    throw error;
  }

  // 🔥 FALLBACK
  const err = new AIServiceError('Unexpected AI service error');
  err.type = 'UNKNOWN';
  throw err;
}
};