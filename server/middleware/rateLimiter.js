const rateLimit = require("express-rate-limit");

/**
 * General API rate limiter — prevents brute-force on room creation/validation.
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." },
});

/**
 * Tighter limiter for room creation specifically.
 */
const createRoomLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many room creation requests. Try again in a minute." },
});

module.exports = { apiLimiter, createRoomLimiter };
