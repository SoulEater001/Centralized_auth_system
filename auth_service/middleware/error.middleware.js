module.exports = (err, req, res, next) => {
  console.error(err.message);

  if (err.message === "Invalid credentials") {
    return res.status(401).json({ message: err.message });
  }

  if (err.message === "User is disabled") {
    return res.status(403).json({ message: err.message });
  }

  // REFRESH
  if (err.message === "No refresh token") {
    return res.status(401).json({ message: err.message });
  }

  if (err.message === "Invalid refresh token") {
    return res.status(403).json({ message: err.message });
  }

  // LOGOUT
  if (err.message === "Tokens required") {
    return res.status(400).json({ message: err.message });
  }

  if (err.message === "Token mismatch") {
    return res.status(403).json({ message: err.message });
  }

  if (err.message === "Session not found") {
    return res.status(404).json({ message: err.message });
  }

  // JWT ERRORS
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ message: "Token expired" });
  }

  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ message: "Invalid token" });
  }

  // PRISMA (optional but useful)
  if (err.code === "P2025") {
    return res.status(404).json({ message: "Record not found" });
  }

  return res.status(500).json({
    message: "Internal Server Error"
  });
};