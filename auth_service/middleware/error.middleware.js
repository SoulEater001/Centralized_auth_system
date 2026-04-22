module.exports = (err, req, res, next) => {
  console.error(err.message);

  if (err.message === "Invalid credentials") {
    return res.status(401).json({ message: err.message });
  }

  res.status(500).json({ message: "Internal Server Error" });
};