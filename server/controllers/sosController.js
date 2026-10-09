const crypto = require("crypto");
const mongoose = require("mongoose");
const twilio = require("twilio");

const SOSAlert = require("../models/SOSAlert");
const Contact = require("../models/Contact");
const User = require("../models/User");
const { normalizePhone, maskPhone } = require("../utils/phone");
const { toNumber, isValidCoord } = require("../utils/geo");

const DUPLICATE_WINDOW_MS = 60 * 1000; // a second press within 1 minute is ignored
const MAX_ALERT_AGE_MS = 12 * 60 * 60 * 1000; // tracking links stop after 12 hours
const SEND_TIMEOUT_MS = 12 * 1000; // don't let one slow message block the rest

// ---------------------------------------------------------------
// Messaging (Twilio)
// ---------------------------------------------------------------

// Created only when first needed, so a missing key doesn't crash the server.
let twilioClient = null;
function getTwilio() {
  if (twilioClient) return twilioClient;

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;

  twilioClient = twilio(sid, token);
  return twilioClient;
}

// SOS_CHANNELS in .env: "whatsapp", "sms" or "whatsapp,sms".
// Default is "whatsapp" because that is what Sakhi used before.
function enabledChannels() {
  return (process.env.SOS_CHANNELS || "whatsapp")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s === "whatsapp" || s === "sms");
}

function sendOne(client, channel, phone, body) {
  if (channel === "whatsapp") {
    return client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886", // Twilio sandbox
      to: `whatsapp:${phone}`,
      body,
    });
  }

  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!from) throw new Error("TWILIO_PHONE_NUMBER is not set on the server");

  return client.messages.create({ from, to: phone, body });
}

function withTimeout(promise, ms, fallback) {
  let timer;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// Sends one message to every contact on every enabled channel, all at once.
// Never throws: each result says whether it worked.
async function sendToContacts(contacts, body) {
  const client = getTwilio();

  if (!client) {
    return contacts.map((c) => ({
      contactId: String(c._id),
      name: c.name,
      phone: maskPhone(c.phone),
      channel: "none",
      ok: false,
      error: "Messaging is not configured on the server",
    }));
  }

  const jobs = [];

  for (const contact of contacts) {
    const phone = normalizePhone(contact.phone);

    for (const channel of enabledChannels()) {
      const base = {
        contactId: String(contact._id),
        name: contact.name,
        phone: maskPhone(phone || contact.phone),
        channel,
      };

      const job = (async () => {
        if (!phone) return { ...base, ok: false, error: "Invalid phone number" };

        try {
          const msg = await sendOne(client, channel, phone, body);
          console.log(`SOS message queued (${channel}) SID: ${msg.sid}`);
          return { ...base, ok: true };
        } catch (err) {
          console.error(`SOS message failed (${channel}) to ${base.phone}:`, err.message);
          return { ...base, ok: false, error: String(err.message).slice(0, 200) };
        }
      })();

      jobs.push(
        withTimeout(job, SEND_TIMEOUT_MS, { ...base, ok: false, error: "Timed out" })
      );
    }
  }

  return Promise.all(jobs);
}

function buildTrackUrl(token) {
  const base = (process.env.PUBLIC_BASE_URL || "").trim().replace(/\/+$/, "");
  return base && token ? `${base}/track/${token}` : null;
}

function buildAlertBody(userName, lat, lng, trackUrl) {
  const lines = ["SAKHI EMERGENCY ALERT", `${userName} needs help.`];

  if (trackUrl) lines.push(`Live location: ${trackUrl}`);

  if (lat != null && lng != null) {
    lines.push(`Map pin: https://www.google.com/maps?q=${lat},${lng}`);
  } else if (!trackUrl) {
    lines.push("Their location is not available.");
  }

  lines.push("Please call them now. If you cannot reach them, call 112.");
  return lines.join("\n");
}

function toResponse(sos, duplicate = false) {
  const total = sos.contactCount || 0;
  const notified = sos.notifiedCount || 0;

  let message = "SOS Alert Sent Successfully";
  if (sos.deliveryStatus === "FAILED") {
    message =
      "SOS saved, but we could not alert your contacts automatically. Call 112 and message them yourself.";
  } else if (sos.deliveryStatus === "PARTIAL") {
    message = `SOS alert sent to ${notified} of ${total} contacts.`;
  }

  return {
    message,
    sosId: sos._id,
    status: sos.deliveryStatus,
    notified,
    total,
    trackingUrl: buildTrackUrl(sos.trackingToken),
    deliveries: (sos.deliveries || []).map((d) => ({
      name: d.name,
      channel: d.channel,
      ok: d.ok,
      error: d.error,
    })),
    duplicate,
  };
}

// ---------------------------------------------------------------
// Trigger SOS
// ---------------------------------------------------------------
const triggerSOS = async (req, res) => {
  try {
    const body = req.body || {};

    // Location is optional: if GPS failed we still send the alert.
    let lat = null;
    let lng = null;

    if (body.latitude != null && body.longitude != null) {
      lat = toNumber(body.latitude);
      lng = toNumber(body.longitude);

      if (!isValidCoord(lat, lng)) {
        return res.status(400).json({ message: "Invalid location." });
      }
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res
        .status(401)
        .json({ message: "Account not found.", code: "INVALID_TOKEN" });
    }

    const contacts = await Contact.find({ userId: user._id });

    // Checked BEFORE saving anything, so no half-created alerts are left behind.
    if (contacts.length === 0) {
      return res.status(400).json({
        code: "NO_CONTACTS",
        message:
          "Add at least one trusted contact so Sakhi can alert them. If you are in danger, call 112 now.",
      });
    }

    // Double-tap protection: reuse the alert from the last minute, don't text everyone again.
    const recent = await SOSAlert.findOne({
      user: user._id,
      status: "ACTIVE",
      createdAt: { $gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
    }).sort({ createdAt: -1 });

    if (recent) {
      return res.json(toResponse(recent, true));
    }

    // Any older alert still marked ACTIVE is closed so only one is live at a time.
    await SOSAlert.updateMany(
      { user: user._id, status: "ACTIVE" },
      { $set: { status: "RESOLVED", endedAt: new Date() } }
    );

    const sos = await SOSAlert.create({
      user: user._id,
      latitude: lat ?? undefined,
      longitude: lng ?? undefined,
      lastLocationAt: lat != null ? new Date() : undefined,
      status: "ACTIVE",
      trackingToken: crypto.randomBytes(16).toString("hex"),
    });

    const message = buildAlertBody(
      user.name,
      lat,
      lng,
      buildTrackUrl(sos.trackingToken)
    );

    const results = await sendToContacts(contacts, message);

    const notifiedIds = [
      ...new Set(results.filter((r) => r.ok).map((r) => r.contactId)),
    ];

    sos.contactCount = contacts.length;
    sos.notifiedCount = notifiedIds.length;
    sos.notifiedContacts = notifiedIds;
    sos.deliveries = results.map(({ contactId, ...rest }) => rest);
    sos.deliveryStatus =
      notifiedIds.length === 0
        ? "FAILED"
        : notifiedIds.length < contacts.length
        ? "PARTIAL"
        : "SENT";

    await sos.save();

    res.status(201).json(toResponse(sos));
  } catch (error) {
    console.error("triggerSOS error:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// ---------------------------------------------------------------
// Update live location (app calls this every ~10 seconds)
// ---------------------------------------------------------------
const updateLocation = async (req, res) => {
  try {
    const { sosId, latitude, longitude } = req.body || {};

    if (!mongoose.isValidObjectId(sosId)) {
      return res.status(400).json({ message: "Invalid SOS id." });
    }

    const lat = toNumber(latitude);
    const lng = toNumber(longitude);

    if (!isValidCoord(lat, lng)) {
      return res.status(400).json({ message: "Invalid location." });
    }

    // Only YOUR alert, and only while it is still active.
    const sos = await SOSAlert.findOneAndUpdate(
      { _id: sosId, user: req.user.id, status: "ACTIVE" },
      { $set: { latitude: lat, longitude: lng, lastLocationAt: new Date() } }
    );

    if (!sos) {
      return res.status(409).json({
        code: "SOS_ENDED",
        message: "This SOS is no longer active.",
      });
    }

    res.json({ message: "Location Updated" });
  } catch (err) {
    console.error("updateLocation error:", err.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// ---------------------------------------------------------------
// Stop SOS
// ---------------------------------------------------------------
const stopSOS = async (req, res) => {
  try {
    const { sosId } = req.body || {};

    if (!mongoose.isValidObjectId(sosId)) {
      return res.status(400).json({ message: "Invalid SOS id." });
    }

    const sos = await SOSAlert.findOneAndUpdate(
      { _id: sosId, user: req.user.id, status: "ACTIVE" },
      { $set: { status: "RESOLVED", endedAt: new Date() } }
    );

    if (!sos) {
      // Maybe it was already stopped: that is fine.
      const exists = await SOSAlert.exists({ _id: sosId, user: req.user.id });

      if (!exists) {
        return res.status(404).json({ message: "SOS not found" });
      }

      return res.json({ message: "SOS Stopped Successfully" });
    }

    // Tell the people we alerted that the alert has ended (so they don't panic).
    if (sos.notifiedContacts && sos.notifiedContacts.length > 0) {
      const [user, contacts] = await Promise.all([
        User.findById(req.user.id),
        Contact.find({ _id: { $in: sos.notifiedContacts }, userId: req.user.id }),
      ]);

      if (user && contacts.length > 0) {
        const endMessage = `Sakhi: ${user.name} has ended their SOS alert. Please check in with them to make sure they are safe.`;

        // Not awaited: the person stopping the alert should not wait for this.
        sendToContacts(contacts, endMessage).catch((e) =>
          console.error("End-of-SOS message error:", e.message)
        );
      }
    }

    res.json({ message: "SOS Stopped Successfully" });
  } catch (err) {
    console.error("stopSOS error:", err.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// ---------------------------------------------------------------
// History, single alert, delete (all limited to the logged-in user)
// ---------------------------------------------------------------
const getSOSHistory = async (req, res) => {
  try {
    const history = await SOSAlert.find({ user: req.user.id })
      .select("-trackingToken -notifiedContacts")
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(history);
  } catch (error) {
    console.error("getSOSHistory error:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

const getSOSById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid SOS id." });
    }

    const sos = await SOSAlert.findOne({
      _id: req.params.id,
      user: req.user.id,
    }).select("-trackingToken -notifiedContacts");

    if (!sos) {
      return res.status(404).json({ message: "SOS not found" });
    }

    res.json(sos);
  } catch (err) {
    console.error("getSOSById error:", err.message);
    res.status(500).json({ message: "Server Error" });
  }
};

const deleteSOS = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid SOS id." });
    }

    const sos = await SOSAlert.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!sos) {
      return res.status(404).json({ message: "SOS not found" });
    }

    res.json({ message: "SOS deleted successfully" });
  } catch (err) {
    console.error("deleteSOS error:", err.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// ---------------------------------------------------------------
// PUBLIC live-tracking data (no login: your contacts open it from a text message).
// Safe because the link contains a long random secret and only shows
// location while the alert is active.
// ---------------------------------------------------------------
const getPublicTrack = async (req, res) => {
  try {
    const { token } = req.params;

    if (!/^[a-f0-9]{32}$/.test(token)) {
      return res.status(404).json({ message: "Not found" });
    }

    const sos = await SOSAlert.findOne({ trackingToken: token })
      .populate("user", "name")
      .lean();

    if (!sos) {
      return res.status(404).json({ message: "Not found" });
    }

    const tooOld =
      Date.now() - new Date(sos.createdAt).getTime() > MAX_ALERT_AGE_MS;
    const active = sos.status === "ACTIVE" && !tooOld;

    res.set("Cache-Control", "no-store");
    res.json({
      active,
      firstName: sos.user && sos.user.name ? sos.user.name.split(" ")[0] : "Someone",
      latitude: active ? sos.latitude ?? null : null,
      longitude: active ? sos.longitude ?? null : null,
      updatedAt: sos.lastLocationAt || sos.createdAt,
      startedAt: sos.createdAt,
    });
  } catch (err) {
    console.error("getPublicTrack error:", err.message);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  triggerSOS,
  getSOSHistory,
  getSOSById,
  updateLocation,
  stopSOS,
  deleteSOS,
  getPublicTrack,
};
