const Incident = require("../models/Incident");

// ==========================================
// CREATE A NEW INCIDENT
// ==========================================
const reportIncident = async (req, res) => {
  try {
    const { type, description, latitude, longitude } = req.body;

    const incident = await Incident.create({
      user: req.user.id,
      type,
      description,
      latitude,
      longitude,
      status: "Pending",
    });

    res.status(201).json({
      message: "Incident reported successfully",
      incident,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

// ==========================================
// GET LOGGED-IN USER'S INCIDENT HISTORY
// ==========================================
const getAllIncidents = async (req, res) => {
  try {
    console.log("=================================");
    console.log("CURRENT USER ID:", req.user.id);
    console.log("=================================");

    const incidents = await Incident.find({
      user: req.user.id,
    }).sort({
      createdAt: -1,
    });

    console.log("INCIDENTS FOUND:", incidents.length);

    res.json(incidents);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

// ==========================================
// GET ALL COMMUNITY INCIDENTS
// ==========================================
const getCommunityIncidents = async (req, res) => {
  try {
    const incidents = await Incident.find().sort({
      createdAt: -1,
    });

    res.json(incidents);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

// ==========================================
// GET SAFETY STATUS
// ==========================================
const getSafetyStatus = async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    const incidents = await Incident.find();

    let nearby = 0;

    console.log("User Location:", latitude, longitude);

    incidents.forEach((incident) => {
      const distance = Math.sqrt(
        Math.pow(latitude - incident.latitude, 2) +
          Math.pow(longitude - incident.longitude, 2)
      );

      console.log("Distance:", distance);

      // Around 1 km radius
      if (distance < 0.01) {
        nearby++;
      }
    });

    const score = Math.max(100 - nearby * 15, 10);

    res.json({
      safetyScore: score,
      nearbyIncidents: nearby,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

// ==========================================
// DELETE INCIDENT
// ==========================================
const deleteIncident = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);

    // Incident doesn't exist
    if (!incident) {
      return res.status(404).json({
        message: "Incident not found",
      });
    }

    // Make sure the logged-in user owns this incident
    if (incident.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        message: "You are not allowed to delete this incident",
      });
    }

    await Incident.findByIdAndDelete(req.params.id);

    res.json({
      message: "Incident deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

module.exports = {
  reportIncident,
  getAllIncidents,
  getCommunityIncidents,
  getSafetyStatus,
  deleteIncident,
};