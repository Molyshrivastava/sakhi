const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  console.log("========== AUTH CHECK ==========");

  const authHeader = req.headers.authorization;

  console.log("AUTH HEADER EXISTS:", !!authHeader);

  if (!authHeader) {
    console.log("❌ NO AUTHORIZATION HEADER");
    return res.status(401).json({
      message: "No token provided",
    });
  }

  console.log(
    "AUTH HEADER START:",
    authHeader.substring(0, 20) + "..."
  );

  const token = authHeader.split(" ")[1];

  console.log("TOKEN EXISTS:", !!token);

  if (!token) {
    console.log("❌ TOKEN MISSING");
    return res.status(401).json({
      message: "Token missing",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("✅ JWT VALID");
    console.log("USER ID:", decoded.id);

    req.user = decoded;
    next();
  } catch (err) {
    console.log("❌ JWT ERROR:", err.message);

    return res.status(403).json({
      message: "Invalid token",
    });
  }
};

module.exports = verifyToken;