
// FILE: src/utils/cache.js


/**
 * Simple in-memory cache with TTL
 */

const cacheStore = new Map();

const DEFAULT_TTL_MS = 60 * 1000; // 1 minute

export const getCache = (key) => {
  const entry = cacheStore.get(key);

  if (!entry) return null;

  const { value, expiry } = entry;

  // Check expiry
  if (Date.now() > expiry) {
    cacheStore.delete(key);
    return null;
  }

  return value;
};

export const setCache = (key, value, ttl = DEFAULT_TTL_MS) => {
  const expiry = Date.now() + ttl;

  cacheStore.set(key, {
    value,
    expiry,
  });
};

export const generateCacheKey = ({ tenantId, queryText }) => {
  return `${tenantId}:${queryText.toLowerCase()}`;
};