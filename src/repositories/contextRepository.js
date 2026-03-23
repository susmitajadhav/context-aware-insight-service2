
// FILE: src/repositories/contextRepository.js


import pool from '../config/db.js';
import { AppError } from '../errors/AppError.js';
import { logger } from '../utils/logger.js';

export const getTenantContext = async (tenantId) => {
  try {
    const start = Date.now();

    const res = await pool.query(
      'SELECT context FROM business_context WHERE tenant_id = $1 LIMIT 1',
      [tenantId]
    );

    const latency = Date.now() - start;

    logger.info({
      event: 'DB_CONTEXT_FETCH',
      tenantId,
      latencyMs: latency,
      rowCount: res.rowCount,
    });

    if (res.rows.length === 0) {
      throw new AppError(
        `No context found for tenant: ${tenantId}`,
        404,
        'CONTEXT_NOT_FOUND'
      );
    }

    return res.rows[0].context;
  } catch (error) {
    logger.error({
      event: 'DB_CONTEXT_ERROR',
      tenantId,
      error: error.message,
    });

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError('Database error', 500, 'DB_ERROR');
  }
};