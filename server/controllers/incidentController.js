const mongoose = require("mongoose");
const Incident = require("../models/Incident");
const { toNumber, isValidCoord, haversineKm } = require("../utils/geo");

const DAY_MS = 24 * 60 * 60 * 1000;
const SAFETY_RADIUS_KM = 1;
const SAFETY_WINDOW_DAYS = 90; // reports older than this are ignored
const RECENT_DAYS = 30; // reports newer than this count fully, older count half

// ==========================================
// CREATE A NEW INCIDENT
// ==========================================
const reportIncident = async (req, res) => {
  try {
    const body = req.body || {};
    const description =
      typeof body.description === "string" ? body.description.trim() : "";

    if (!Incident.TYPES.includes(body.type)) {
      return res
        .status(400)
        .json({ message: "Please choose a valid incident type." });
    }

    if (description.length < 5) {
      return res.status(400).json({
        message: "Please describe what happened (at least 5 characters).",
      });
    }

    if (description.length > 1000) {
      return res
        .status(400)
        .json({ message: "Description is too long (max 1000 characters)." });
    }

    const lat = toNumber(body.latitude);
    const lng = toNumber(body.longitude);

    if (!isValidCoord(lat, lng)) {
      return res
        .status(400)
        .json({ message: "A valid location is required to report an incident." });
    }

    const incident = await Incident.create({
      user: req.user.id,
      type: body.type,
      description,
      latitude: lat,
      longitude: lng,
      status: "Pending",
    });

    res.status(201).json({
      message: "Incident reported successfully",
      incident,
    });
  } catch (error) {
    console.error("reportIncident error:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// ==========================================
// GET LOGGED-IN USER'S INCIDENT HISTORY
// ==========================================
const getAllIncidents = async (req, res) => {
  try {
    const incidents = await Incident.find({
      user: req.user.id,
    }).sort({
      createdAt: -1,
    });

    res.json(incidents);
  } catch (error) {
    console.error("getAllIncidents error:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// ==========================================
// GET COMMUNITY INCIDENTS (for the map)
// - last 90 days only, newest 500
// - reporter identity is NOT included
// - location is rounded to ~100 m so a report can't point to someone's front door
// ==========================================
const getCommunityIncidents = async (req, res) => {
  try {
    const since = new Date(Date.now() - SAFETY_WINDOW_DAYS * DAY_MS);

    const incidents = await Incident.find({ createdAt: { $gte: since } })
      .select("type description latitude longitude status createdAt")
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    const round = (n) => Math.round(n * 1000) / 1000;

    res.json(
      incidents.map((i) => ({
        ...i,
        latitude: round(i.latitude),
        longitude: round(i.longitude),
      }))
    );
  } catch (error) {
    console.error("getCommunityIncidents error:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// ==========================================
// GET SAFETY STATUS (reports within 1 km, last 90 days)
// ==========================================
const getSafetyStatus = async (req, res) => {
  try {
    const lat = toNumber(req.query.latitude);
    const lng = toNumber(req.query.longitude);

    if (!isValidCoord(lat, lng)) {
      return res.status(400).json({ message: "Valid latitude and longitude are required." });
    }

    // Ask the database only for a small box around the user, then measure real distance.
    const dLat = SAFETY_RADIUS_KM / 111;
    const dLng =
      SAFETY_RADIUS_KM / (111 * Math.max(Math.cos((lat * Math.PI) / 180), 0.01));

    const since = new Date(Date.now() - SAFETY_WINDOW_DAYS * DAY_MS);

    const candidates = await Incident.find({
      createdAt: { $gte: since },
      latitude: { $gte: lat - dLat, $lte: lat + dLat },
      longitude: { $gte: lng - dLng, $lte: lng + dLng },
    })
      .select("latitude longitude createdAt")
      .lean();

    const recentCutoff = Date.now() - RECENT_DAYS * DAY_MS;
    let nearby = 0;
    let weighted = 0;

    for (const incident of candidates) {
      if (haversineKm(lat, lng, incident.latitude, incident.longitude) <= SAFETY_RADIUS_KM) {
        nearby++;
        weighted += new Date(incident.createdAt).getTime() >= recentCutoff ? 1 : 0.5;
      }
    }

    const score = Math.max(Math.round(100 - weighted * 15), 10);
    const level = score >= 90 ? "LOW_RISK" : score >= 70 ? "CAUTION" : "HIGH_RISK";

    res.json({
      safetyScore: score,
      nearbyIncidents: nearby,
      level,
      radiusKm: SAFETY_RADIUS_KM,
      windowDays: SAFETY_WINDOW_DAYS,
      note: "Based on community reports from the last 90 days. No reports does not guarantee an area is safe.",
    });
  } catch (err) {
    console.error("getSafetyStatus error:", err.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// ==========================================
// DELETE INCIDENT (only your own)
// ==========================================
const deleteIncident = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid incident id." });
    }

    const incident = await Incident.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    res.json({ message: "Incident deleted successfully" });
  } catch (error) {
    console.error("deleteIncident error:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  reportIncident,
  getAllIncidents,
  getCommunityIncidents,
  getSafetyStatus,
  deleteIncident,
};
