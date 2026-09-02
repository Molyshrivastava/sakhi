const express = require("express");

const router = express.Router();

const verifyToken = require("../middleware/auth");

const {
  reportIncident,
  getAllIncidents,
  getCommunityIncidents,
  getSafetyStatus,
  deleteIncident,
} = require("../controllers/incidentController");

// ==========================================
// REPORT A NEW INCIDENT
// ==========================================
router.post("/", verifyToken, reportIncident);

// ==========================================
// GET LOGGED-IN USER'S INCIDENT HISTORY
// ==========================================
router.get("/my", verifyToken, getAllIncidents);

// ==========================================
// GET ALL COMMUNITY INCIDENTS
// ==========================================
router.get("/community", verifyToken, getCommunityIncidents);

// ==========================================
// GET SAFETY STATUS
// ==========================================
router.get("/safety-status", verifyToken, getSafetyStatus);

// ==========================================
// DELETE AN INCIDENT
// ==========================================
router.delete("/:id", verifyToken, deleteIncident);

module.exports = router;