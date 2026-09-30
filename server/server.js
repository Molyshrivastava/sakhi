const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

const app = express();

// Request logger
app.use((req, res, next) => {
  console.log("REQUEST:", req.method, req.url);
  next();
});

// Connect MongoDB
connectDB();

app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("WomenShield API Running...");
});

// Routes
const userRoutes = require("./routes/userRoutes");
const contactRoutes = require("./routes/contactRoutes");
const sosRoutes = require("./routes/sosRoutes");
const incidentRoutes = require("./routes/incidentRoutes");
const aiRoutes = require("./routes/aiRoutes");

app.use("/api/users", userRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/sos", sosRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/ai", aiRoutes);

// Render provides PORT automatically
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});