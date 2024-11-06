const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware to verify token and check if the user is authenticated
module.exports.authMiddleware = (req, res, next) => {
  const [, token] = (req.header("Authorization") ?? "")?.split(" ");

  console.log("token", token);

  if (!token) {
    return res.status(401).json({ error: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Add the decoded user info (id, role) to the request
    next();
  } catch (error) {
    res.status(401).json({ error: "Token is not valid" });
  }
};

// Middleware to check if the authenticated user is an admin
module.exports.adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied. Admins only." });
  }
  next();
};
