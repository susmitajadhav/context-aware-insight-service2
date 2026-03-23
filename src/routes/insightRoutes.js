
// FILE: src/routes/insightRoutes.js


import express from 'express';
import { createInsightController } from '../controllers/insightController.js';
import { healthCheckController } from '../controllers/healthController.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * Health Check
 */
router.get('/health', healthCheckController);

/**
 * Insight API (with rate limiting)
 */
router.post(
  '/v1/insight-query',
  rateLimiter,
  createInsightController
);

export default router;