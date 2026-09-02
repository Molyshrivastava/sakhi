const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/auth");

const {
  triggerSOS,
  getSOSHistory,
  updateLocation,
  stopSOS,
  deleteSOS,
} = require("../controllers/sosController");

router.post("/trigger", verifyToken, triggerSOS);

router.get("/history", verifyToken, getSOSHistory);

router.put("/update-location", verifyToken, updateLocation);

router.put("/stop", verifyToken, stopSOS);

router.delete("/:id", verifyToken, deleteSOS);
// KEEP THIS LAST
router.get("/:id", async (req, res) => {
  const SOSAlert = require("../models/SOSAlert");

  const sos = await SOSAlert.findById(req.params.id);

  res.json(sos);
});

module.exports = router;