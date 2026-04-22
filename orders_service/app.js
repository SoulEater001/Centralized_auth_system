const express = require("express");
const jwt = require("jsonwebtoken");

require("dotenv").config();

const app = express();
app.use(express.json());
const PORT = process.env.PORT;

// Middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.sendStatus(401);

  try {
    const decoded = jwt.verify(token, "supersecret");
    req.user = decoded;
    next();
  } catch {
    res.sendStatus(403);
  }
}

// RBAC Middleware
const authorize = (permission) => {
  return (req, res, next) => {
    if (!req.user.permissions.includes(permission)) {
      return res.sendStatus(403);
    }
    next();
  };
}

//Routes
// app.get("/", (req, res) => {
//   res.send("Orders Service is running");
// });

app.get("/", authenticate, authorize("orders:read"), (req, res) => {
  res.json([{ id: 1, item: "Laptop" }]);
});

app.listen(PORT, () => {
  console.log(`Running on port ${PORT}`);
});