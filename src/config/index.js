
// FILE: src/config/index.js


import { env } from './env.js';

export const config = {
  port: env.port,

  ai: {
    url: env.ai.url,
    timeoutMs: env.ai.timeoutMs,
    retryCount: env.ai.retryCount,
    retryDelay: env.ai.retryDelay,
  },

  logLevel: env.logLevel,
};