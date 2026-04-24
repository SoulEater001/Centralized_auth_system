const express = require("express");
const jwt = require("jsonwebtoken");

const authRoutes = require("./routes/auth.routes");
const { auditLogger } = require("./middleware/auditLogger");
const errorMiddleware = require("./middleware/error.middleware");

require("dotenv").config();

const app = express();
app.use(express.json());
const PORT = process.env.PORT;

app.use(auditLogger);
app.get("/test", (req, res) => {
  res.send("Auth Service is running");
});

// app.post("/login", (req, res) => {
//   const { email } = req.body;

//   // Mock user
//   const user = {
//     id: "1",
//     email,
//     roles: ["admin"],
//     permissions: ["orders:read", "orders:write", "orders:delete"]
//   };

//   const token = jwt.sign(user, process.env.JWT_SECRET, {
//     expiresIn: "1h"
//   });

//   res.json({ token });
// });

app.use("/", authRoutes);
app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`Running on port ${PORT}`);
});