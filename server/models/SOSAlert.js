const mongoose = require("mongoose");

const sosAlertSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Location can be missing if the phone could not get a GPS fix.
    latitude: Number,
    longitude: Number,
    lastLocationAt: Date,

    status: {
      type: String,
      enum: ["ACTIVE", "RESOLVED"],
      default: "ACTIVE",
    },
    endedAt: Date,

    // Secret random code used in the live-tracking link sent to contacts.
    // sparse = old alerts created before this field existed are fine.
    trackingToken: {
      type: String,
      unique: true,
      sparse: true,
    },

    // What actually happened when we tried to alert contacts.
    deliveryStatus: {
      type: String,
      enum: ["SENT", "PARTIAL", "FAILED"],
      default: "FAILED",
    },
    contactCount: { type: Number, default: 0 },
    notifiedCount: { type: Number, default: 0 },
    notifiedContacts: [{ type: mongoose.Schema.Types.ObjectId }],
    deliveries: [
      {
        _id: false,
        name: String,
        phone: String, // masked, e.g. +91******3210
        channel: String,
        ok: Boolean,
        error: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

sosAlertSchema.index({ user: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("SOSAlert", sosAlertSchema);
