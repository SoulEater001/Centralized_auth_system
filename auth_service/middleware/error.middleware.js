module.exports = (err, req, res, next) => {
  console.error(err.message);

  if (err.message === "Invalid credentials") {
    return res.status(401).json({ message: err.message });
  }

  if (err.message === "User is disabled") {
    return res.status(403).json({ message: error.message });
  }

  res.status(500).json({ message: "Internal Server Error" });
};