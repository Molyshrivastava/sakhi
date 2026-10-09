const jwt = require("jsonwebtoken");

// Checks the "Authorization: Bearer <token>" header on protected routes.
// Invalid or expired tokens get 401 (not 403) so the app knows
// "log in again" is the fix.
const verifyToken = (req, res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      message: "Please log in to continue.",
      code: "NO_TOKEN",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    req.user = decoded; // { id, iat, exp }
    next();
  } catch (err) {
    const expired = err.name === "TokenExpiredError";

    return res.status(401).json({
      message: expired
        ? "Your session has expired. Please log in again."
        : "Invalid session. Please log in again.",
      code: expired ? "TOKEN_EXPIRED" : "INVALID_TOKEN",
    });
  }
};

module.exports = verifyToken;
