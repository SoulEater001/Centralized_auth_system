const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT


app.get("/", (req, res) => {
  res.send("Api Gateway is running");
});

// app.use((req, res, next) => {
//   console.log("Incoming:", req.method, req.url);
//   next();
// });

// Routes
app.use("/auth", createProxyMiddleware({
  target: "http://localhost:3001",
  changeOrigin: true,
}));

app.use("/orders", createProxyMiddleware({
  target: "http://localhost:3002",
  changeOrigin: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.listen(PORT, () => {
  console.log(`Running on port ${PORT}`);
});