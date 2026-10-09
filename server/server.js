require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");

// ---------- Check the .env file first, with a clear message ----------
for (const key of ["MONGO_URI", "JWT_SECRET"]) {
  if (!process.env[key]) {
    console.error(`Missing ${key}. Add it to server/.env and restart.`);
    process.exit(1);
  }
}

if (process.env.JWT_SECRET.length < 32) {
  console.warn(
    "WARNING: JWT_SECRET is short. Use a long random value (32+ characters)."
  );
}

const app = express();

app.disable("x-powered-by");

// Needed when the server sits behind Render/Railway/etc., so rate limits see the real visitor IP.
app.set("trust proxy", 1);

// ---------- CORS: which websites may call this API ----------
// The phone app is not a website, so CORS does not affect it.
// CORS_ORIGINS in .env: comma-separated list, e.g. http://localhost:5173
const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// While developing, any localhost port is fine (Vite may pick 5173, 5174, 5175...).
const isLocalDevOrigin = (origin) =>
  process.env.NODE_ENV !== "production" &&
  /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

app.use(
  cors({
    origin: (origin, callback) => {
      // No origin = mobile app, curl, Postman: allowed.
      if (!origin || allowedOrigins.includes(origin) || isLocalDevOrigin(origin)) {
        return callback(null, true);
      }
      callback(null, false);
    },
  })
);

app.use(express.json({ limit: "100kb" }));

// Express 5 leaves req.body undefined when no JSON was sent. Make it always an object.
app.use((req, res, next) => {
  if (!req.body) req.body = {};
  next();
});

// Simple request log (development only; never logs bodies or tokens).
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    console.log("REQUEST:", req.method, req.url);
    next();
  });
}

// ---------- Health check ----------
app.get("/", (req, res) => {
  res.send("Sakhi API running...");
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// ---------- Routes ----------
const userRoutes = require("./routes/userRoutes");
const contactRoutes = require("./routes/contactRoutes");
const sosRoutes = require("./routes/sosRoutes");
const incidentRoutes = require("./routes/incidentRoutes");
const aiRoutes = require("./routes/aiRoutes");
const trackRoutes = require("./routes/trackRoutes");

app.use("/api/users", userRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/sos", sosRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/ai", aiRoutes);
app.use("/track", trackRoutes); // public live-location page for your contacts

// ---------- Unknown URL ----------
app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

// ---------- Any error that was not handled above ----------
// (Express needs all four arguments here to treat this as an error handler.)
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid JSON in request." });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ message: "Request is too large." });
  }

  console.error("Unhandled error:", err.message);
  res.status(500).json({ message: "Server Error" });
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

// Render provides PORT automatically
const PORT = process.env.PORT || 5000;

// Start listening only after the database is connected.
connectDB().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
});

module.exports = app;
