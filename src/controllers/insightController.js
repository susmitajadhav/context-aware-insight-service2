
// FILE: src/controllers/insightController.js


import { createInsight } from '../services/insightService.js';
import { logger } from '../utils/logger.js';
import { insightSchema } from '../validators/insightValidator.js';

export const createInsightController = async (req, res) => {
  const requestId = req.requestId;

  
  // Request log

  logger.info({
    requestId,
    event: 'REQUEST_RECEIVED',
    path: req.originalUrl,
    method: req.method,
    body: req.body,
  });


  // Validation

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
  
    // Call service
   
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
      errorCode: error.code || 'UNKNOWN_ERROR',
    });

    // Known errors
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        status: 'error',
        message: error.message,
        requestId,
      });
    }

    // Unknown fallback
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      requestId,
    });
  }
};