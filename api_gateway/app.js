const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const redisClient = require("./utils/redis");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

const globalLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use((req, res, next) => {
  if (req.originalUrl.startsWith("/auth/login")) {
    return next();
  }
  globalLimiter(req, res, next);
});

const authLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }),
  windowMs: 60 * 1000, //1 minute
  max: 10,
  message: { message: "Too many login attempts, try later" },
});

app.get("/test", (req, res) => {
  res.send("Api Gateway is running");
});

app.use("/auth/login", authLimiter);
// Routes
app.use("/auth", createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL,
  changeOrigin: true,
}));

app.use("/orders", createProxyMiddleware({
  target: process.env.ORDERS_SERVICE_URL,
  changeOrigin: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.listen(PORT, () => {
  console.log(`Running on port ${PORT}`);
});