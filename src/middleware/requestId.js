
// FILE: src/middleware/requestId.js


/**
 * Middleware to attach unique requestId to every request
 */
export const requestIdMiddleware = (req, res, next) => {
  const requestId =
    req.headers['x-request-id'] ||
    `req-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  // Attach to request
  req.requestId = requestId;

  // Send back in response header
  res.setHeader('x-request-id', requestId);

  next();
};