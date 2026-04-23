const jwt = require("jsonwebtoken");
require("dotenv").config();
const redis = require("../utils/redis");

exports.authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Invalid token format" });
  }

  const isBlacklisted = await redis.get(`blacklist:${token}`);

  if (isBlacklisted) {
    return res.status(401).json({ message: "Token revoked" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // attach user data
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid token" });
  }
};