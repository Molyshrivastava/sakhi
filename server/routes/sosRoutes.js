const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/auth");
const { sosLimiter, trackLimiter } = require("../middleware/rateLimiters");

const {
  triggerSOS,
  getSOSHistory,
  getSOSById,
  updateLocation,
  stopSOS,
  deleteSOS,
  getPublicTrack,
} = require("../controllers/sosController");

// PUBLIC: live location for the link sent to your contacts (no login needed).
// Must stay above "/:id" so "track" is not mistaken for an id.
router.get("/track/:token", trackLimiter, getPublicTrack);

router.post("/trigger", verifyToken, sosLimiter, triggerSOS);

router.get("/history", verifyToken, getSOSHistory);

router.put("/update-location", verifyToken, updateLocation);

router.put("/stop", verifyToken, stopSOS);

router.delete("/:id", verifyToken, deleteSOS);

// KEEP THIS LAST
router.get("/:id", verifyToken, getSOSById);

module.exports = router;
