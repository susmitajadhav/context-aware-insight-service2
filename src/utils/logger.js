// =========================
// FILE: src/utils/logger.js
// =========================

/**
 * Simple structured logger (JSON format)
 * Production-ready foundation (can replace with Winston/Pino later)
 */

const log = (level, data) => {
  const logEntry = {
    level,
    timestamp: new Date().toISOString(),
    ...data,
  };

  // Always stringify → structured logs
  console.log(JSON.stringify(logEntry));
};

export const logger = {
  info: (data) => log('info', data),
  warn: (data) => log('warn', data),
  error: (data) => log('error', data),
};