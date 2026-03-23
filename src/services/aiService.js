
// FILE: src/services/aiService.js


import axios from 'axios';
import CircuitBreaker from 'opossum';

import { logger } from '../utils/logger.js';
import { AIServiceError } from '../errors/AIServiceError.js';
import { config } from '../config/index.js';


// Axios Instance


const aiClient = axios.create({
  baseURL: config.ai.url,
  timeout: config.ai.timeoutMs,
  headers: {
    'Content-Type': 'application/json',
  },
});


// Core AI HTTP Call


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
      throw new Error('Invalid AI response format');
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

    //  Timeout case
    if (error.code === 'ECONNABORTED') {
      throw new AIServiceError('AI service timeout');
    }

    //  AI responded with error
    if (error.response) {
      throw new AIServiceError(
        `AI service responded with status ${error.response.status}`
      );
    }

    //  Network failure
    throw new AIServiceError('AI service unavailable');
  }
};


// Circuit Breaker Setup


const breaker = new CircuitBreaker(aiHttpCall, {
  timeout: config.ai.timeoutMs,
  errorThresholdPercentage: 50,
  resetTimeout: 5000,
});


// Circuit Breaker Events


breaker.on('open', () => {
  logger.warn({ event: 'CIRCUIT_OPEN' });
});

breaker.on('halfOpen', () => {
  logger.warn({ event: 'CIRCUIT_HALF_OPEN' });
});

breaker.on('close', () => {
  logger.info({ event: 'CIRCUIT_CLOSED' });
});


// Public Function


export const callAI = async ({ queryText, context, requestId }) => {
  try {
    return await breaker.fire({ queryText, context, requestId });
  } catch (error) {
    logger.error({
      requestId,
      event: 'AI_CALL_FAILED',
      error: error.message,
    });

   throw new AIServiceError(
  error.message.includes('Breaker')
    ? 'AI service temporarily unavailable'
    : error.message
);
  }
};