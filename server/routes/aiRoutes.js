const express = require("express");

const router = express.Router();

const verifyToken = require("../middleware/auth");
const { aiLimiter } = require("../middleware/rateLimiters");
const { chatWithAI } = require("../controllers/aiController");

// Login required + rate limited, so strangers can't use up your Gemini quota.
router.post("/chat", verifyToken, aiLimiter, chatWithAI);

module.exports = router;
