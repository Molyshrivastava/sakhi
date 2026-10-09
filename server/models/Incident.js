const mongoose = require("mongoose");

const TYPES = [
  "Harassment",
  "Stalking",
  "Theft",
  "Poor Street Lighting",
  "Unsafe Area",
  "Suspicious Activity",
];

const incidentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      required: true,
      enum: TYPES,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    latitude: {
      type: Number,
      required: true,
    },

    longitude: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

// Makes "reports near me" and "newest reports" queries fast.
incidentSchema.index({ latitude: 1, longitude: 1 });
incidentSchema.index({ createdAt: -1 });

const Incident = mongoose.model("Incident", incidentSchema);
Incident.TYPES = TYPES;

module.exports = Incident;
