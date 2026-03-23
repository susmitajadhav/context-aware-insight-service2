// =========================
// FILE: src/repositories/queryRepository.js


import pool from '../config/db.js';
import { logger } from '../utils/logger.js';

export const saveQueryLog = async ({
  tenantId,
  queryText,
  response,
  latency,
  status,
}) => {
  try {
    const start = Date.now();

    await pool.query(
      `INSERT INTO query_logs 
      (tenant_id, query_text, response, latency_ms, status)
      VALUES ($1, $2, $3, $4, $5)`,
      [tenantId, queryText, response, latency, status]
    );

    const dbLatency = Date.now() - start;

    logger.info({
      event: 'DB_LOG_INSERT',
      tenantId,
      status,
      dbLatencyMs: dbLatency,
    });
  } catch (error) {
    logger.error({
      event: 'DB_LOG_ERROR',
      tenantId,
      error: error.message,
    });

    //  Do NOT throw — logging should not break main flow
  }
};