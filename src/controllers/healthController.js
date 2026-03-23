
// FILE: src/controllers/healthController.js

import pool from '../config/db.js';
import axios from 'axios';
import { config } from '../config/index.js';

export const healthCheckController = async (req, res) => {
  const start = Date.now();

  let dbStatus = 'unknown';
  let aiStatus = 'unknown';

  let dbLatency = null;
  let aiLatency = null;

  
  // 1. DB CHECK
 
  try {
    const dbStart = Date.now();

    await pool.query('SELECT 1');

    dbLatency = Date.now() - dbStart;
    dbStatus = 'ok';

  } catch (error) {
    dbStatus = 'down';
  }

 
  // 2. AI CHECK

  try {
    const aiStart = Date.now();

    await axios.post(config.ai.url, {
      queryText: 'health check',
      context: { industry: 'test', region: 'test' },
    });

    aiLatency = Date.now() - aiStart;
    aiStatus = 'ok';

  } catch (error) {
    aiStatus = 'down';
  }


  // 3. OVERALL STATUS

  let overallStatus = 'healthy';

  if (dbStatus === 'down') {
    overallStatus = 'unhealthy';
  } else if (aiStatus === 'down') {
    overallStatus = 'degraded';
  }

  const totalLatency = Date.now() - start;

  return res.status(
    overallStatus === 'healthy' ? 200 : 503
  ).json({
    status: overallStatus,
    checks: {
      database: {
        status: dbStatus,
        latencyMs: dbLatency,
      },
      aiService: {
        status: aiStatus,
        latencyMs: aiLatency,
      },
    },
    totalLatencyMs: totalLatency,
    timestamp: new Date().toISOString(),
  });
};