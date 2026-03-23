
// FILE: src/config/env.js


import Joi from 'joi';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();


// ENV VALIDATION SCHEMA

const envSchema = Joi.object({
  PORT: Joi.number().default(3000),

  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().required(),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),

  AI_SERVICE_URL: Joi.string().uri().required(),
  AI_TIMEOUT_MS: Joi.number().default(1000),

  RETRY_COUNT: Joi.number().min(0).max(5).default(2),
  RETRY_DELAY_MS: Joi.number().default(100),

  LOG_LEVEL: Joi.string().valid('info', 'warn', 'error').default('info'),

  // V2 additions
  AI_FAILURE_RATE: Joi.number().min(0).max(1).default(0.3),
  AI_DELAY_MS: Joi.number().default(500),

}).unknown();


// VALIDATE ENV

const { value, error } = envSchema.validate(process.env);

if (error) {
  console.error('❌ ENV VALIDATION FAILED:', error.message);
  process.exit(1);
}


// EXPORT CLEAN CONFIG

export const env = {
  port: value.PORT,

  db: {
    host: value.DB_HOST,
    port: value.DB_PORT,
    user: value.DB_USER,
    password: value.DB_PASSWORD,
    name: value.DB_NAME,
  },

  ai: {
    url: value.AI_SERVICE_URL,
    timeoutMs: value.AI_TIMEOUT_MS,
    retryCount: value.RETRY_COUNT,
    retryDelay: value.RETRY_DELAY_MS,
    failureRate: value.AI_FAILURE_RATE,
    delayMs: value.AI_DELAY_MS,
  },

  logLevel: value.LOG_LEVEL,
};