require("dotenv").config();

const SOSAlert = require("../models/SOSAlert");
const Contact = require("../models/Contact");
const twilio = require("twilio");
const User = require("../models/User");
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const stopSOS = async (req, res) => {
  try {
    const { sosId } = req.body;

    await SOSAlert.findByIdAndUpdate(sosId, {
      status: "COMPLETED",
    });

    res.json({
      message: "SOS Stopped Successfully",
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

// Trigger SOS
const triggerSOS = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
const user = await User.findById(req.user.id);
    // Save SOS in database
    const sos = await SOSAlert.create({
      user: req.user.id,
      latitude,
      longitude,
      status: "ACTIVE",
    });

    // Get trusted contacts
    const contacts = await Contact.find({
      userId: req.user.id,
    });
if (contacts.length === 0) {
  return res.status(400).json({
    message: "No trusted contacts found.",
  });
}
    // Send SMS to every contact
for (const contact of contacts) {
  try {

    // Add +91 automatically if missing
    const phone = contact.phone.startsWith("+")
      ? contact.phone
      : `+91${contact.phone}`;

  const locationLink = `https://www.google.com/maps?q=${latitude},${longitude}`;

const message = await client.messages.create({
  from: "whatsapp:+14155238886",
  to: `whatsapp:${phone}`,
  body: `🚨 *SAKHI EMERGENCY ALERT* 🚨

${user.name} needs immediate help!

📍 Live Location:
${locationLink}

⚠️ Please contact them immediately or reach the location if possible.`,
});

console.log("Message SID:", message.sid);
console.log("Status:", message.status);

  } catch (err) {
    console.log("Failed to send SMS to:", contact.phone);
    console.log(err.message);
  }
}

  res.status(201).json({
  message: "SOS Alert Sent Successfully",
  sosId: sos._id,
});

  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Server Error",
    });
  }
};

// Get SOS History
const getSOSHistory = async (req, res) => {
  try {
    const history = await SOSAlert.find({
      user: req.user.id,
    }).sort({ createdAt: -1 });

    res.json(history);

  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Server Error",
    });
  }
};
const updateLocation = async (req, res) => {
  try {
    const { sosId, latitude, longitude } = req.body;

    await SOSAlert.findByIdAndUpdate(sosId, {
      latitude,
      longitude,
    });

    res.json({
      message: "Location Updated",
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Server Error",
    });
  }
};
const deleteSOS = async (req, res) => {
  try {
    await SOSAlert.findByIdAndDelete(req.params.id);

    res.json({
      message: "SOS deleted successfully",
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Server Error",
    });
  }
};
module.exports = {
  triggerSOS,
  getSOSHistory,
  updateLocation,
  stopSOS,
  deleteSOS,
};