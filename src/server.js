
// FILE: src/server.js


import express from 'express';
import insightRoutes from './routes/insightRoutes.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { logger } from './utils/logger.js';
import rateLimit from 'express-rate-limit';

// import triggers env validation
import './config/env.js';

// --- Create app ---
const app = express();


// Middleware Order (CRITICAL)


// 1️⃣ Parse JSON
app.use(express.json());

// 2️⃣ Generate requestId FIRST
app.use(requestIdMiddleware);

// 3️⃣ Rate Limiter (protect system)
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn({
      requestId: req.requestId,
      event: 'RATE_LIMIT_EXCEEDED',
      ip: req.ip,
    });

    return res.status(429).json({
      status: 'error',
      message: 'Too many requests, please try again later',
      requestId: req.requestId,
    });
  },
});

app.use(limiter);

// 4️⃣ Log incoming request
app.use((req, res, next) => {
  logger.info({
    requestId: req.requestId,
    event: 'HTTP_REQUEST',
    method: req.method,
    path: req.url,
  });
  next();
});

// 5️⃣ Log outgoing response
app.use((req, res, next) => {
  res.on('finish', () => {
    logger.info({
      requestId: req.requestId,
      event: 'HTTP_RESPONSE',
      method: req.method,
      path: req.url,
      statusCode: res.statusCode,
    });
  });
  next();
});


// Routes

app.use('/api', insightRoutes);


// 404 Handler

app.use((req, res) => {
  logger.warn({
    requestId: req.requestId,
    event: 'ROUTE_NOT_FOUND',
    path: req.originalUrl,
  });

  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    requestId: req.requestId,
  });
});


// Global Error Handler

app.use((err, req, res, next) => {
  logger.error({
    requestId: req.requestId,
    event: 'UNHANDLED_ERROR',
    error: err.message,
    stack: err.stack,
  });

  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    requestId: req.requestId,
  });
});

// Start Server

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info({
    event: 'SERVER_STARTED',
    port: PORT,
  });
});