const fs = require("fs");
const path = require("path");

const logFile = path.join(__dirname, "../logs/audit.log");

exports.auditLogger = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    let user = "anonymous";

    // Authenticated requests
    if (req.user?.userId) {
      user = req.user.userId;
    } else if (req.originalUrl.startsWith("/auth/login")) {
      user = "unknown-email";
    }


    const log = {
      time: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      user,
      status: res.statusCode,
      duration: Date.now() - start,
      ip: req.ip
    };

    fs.appendFileSync(logFile, JSON.stringify(log) + "\n");
    console.log(JSON.stringify(log));
  });

  next();
};