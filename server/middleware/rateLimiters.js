// Rate limiters: stop people (or bots) from hammering sensitive endpoints.
// Example: without this, someone could try millions of passwords on /login.

const rateLimit = require("express-rate-limit");

function make({ windowMs, limit, message, byUser = false }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { message },
    // For logged-in routes we count per user instead of per IP address.
    ...(byUser ? { keyGenerator: (req) => (req.user && req.user.id) || "anonymous" } : {}),
    // Set DISABLE_RATE_LIMIT=true in .env while testing if it gets in your way.
    skip: () => process.env.DISABLE_RATE_LIMIT === "true",
  });
}

const MINUTE = 60 * 1000;

module.exports = {
  loginLimiter: make({
    windowMs: 15 * MINUTE,
    limit: 10,
    message: "Too many login attempts. Please try again in 15 minutes.",
  }),
  registerLimiter: make({
    windowMs: 60 * MINUTE,
    limit: 10,
    message: "Too many sign-ups from this network. Please try again later.",
  }),
  otpLimiter: make({
    windowMs: 15 * MINUTE,
    limit: 8,
    message: "Too many code requests. Please wait a few minutes and try again.",
  }),
  sosLimiter: make({
    windowMs: 10 * MINUTE,
    limit: 6,
    message: "Too many SOS requests. If you are in danger, call 112 now.",
    byUser: true,
  }),
  aiLimiter: make({
    windowMs: 10 * MINUTE,
    limit: 30,
    message: "You are sending messages very quickly. Please wait a moment.",
    byUser: true,
  }),
  incidentLimiter: make({
    windowMs: 60 * MINUTE,
    limit: 10,
    message: "You have submitted many reports recently. Please try again later.",
    byUser: true,
  }),
  trackLimiter: make({
    windowMs: MINUTE,
    limit: 120,
    message: "Too many requests.",
  }),
};
