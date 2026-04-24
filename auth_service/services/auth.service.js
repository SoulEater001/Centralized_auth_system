const prisma = require("../utils/prisma");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const redis = require("../utils/redis");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const privateKey = fs.readFileSync(
  path.join(__dirname, "../keys/private.key"),
  "utf8"
);
const publicKey = fs.readFileSync(
  path.join(__dirname, "../keys/public.key"),
  "utf8"
);

const logLogin = (data) => {
  console.log(JSON.stringify({
    event: "login_attempt",
    ...data,
    time: new Date().toISOString()
  }));
};

require("dotenv").config();

exports.loginUser = async ({ email, password }) => {
  // 1. Find user
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!user) {
    logLogin({
      email,
      success: false,
      reason: "user_not_found"
    });
    throw new Error("Invalid credentials");
  }

  if (!user.isActive) {
    logLogin({
      email,
      success: false,
      reason: "user_disabled"
    });
    throw new Error("User is disabled");
  }

  // 2. Check password
  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    logLogin({
      email,
      success: false,
      reason: "invalid_password"
    });
    throw new Error("Invalid credentials");
  }

  // 3. Extract permissions
  const permissions = user.roles.flatMap(r =>
    r.role.permissions.map(p => `${p.permission.resource}:${p.permission.action}`)
  );

  const roles = user.roles.map(r => r.role.name);

  // Access Token (short-lived)
  const accessToken = jwt.sign(
    {
      userId: user.id,
      roles,
      permissions
    },
    privateKey,
    {
      algorithm: "RS256",
      expiresIn: "15m"
    }
  );

  const sessionId = crypto.randomUUID();
  // Refresh Token (long-lived)
  const refreshToken = jwt.sign(
    { userId: user.id, sessionId },
    privateKey,
    {
      algorithm: "RS256",
      expiresIn: "7d"
    }
  );

  const hashedToken = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  // Store refresh token in Redis
  await redis.set(`refresh:${user.id}:${sessionId}`, hashedToken, {
    EX: 7 * 24 * 60 * 60 // 7 days
  });
  logLogin({
    email,
    userId: user.id,
    success: true,
    roles
  });

  return {
    accessToken,
    refreshToken,
    sessionId
  };
};

exports.logoutUser = async (accessToken, refreshToken) => {
  if (!accessToken || !refreshToken) {
    throw new Error("Tokens required");
  }

  const decodedAccess = jwt.verify(accessToken, publicKey, { algorithms: ["RS256"] });
  const decodedRefresh = jwt.verify(refreshToken, publicKey, { algorithms: ["RS256"] });

  if (decodedAccess.userId !== decodedRefresh.userId) {
    throw new Error("Token mismatch");
  }

  const { userId } = decodedAccess;
  const { sessionId } = decodedRefresh;

  const stored = await redis.get(`refresh:${userId}:${sessionId}`);

  if (!stored) {
    throw new Error("Session not found");
  }

  // Delete refresh token
  await redis.del(`refresh:${userId}:${sessionId}`);

  // Blacklist access token
  const expiry = Math.max(
    decodedAccess.exp - Math.floor(Date.now() / 1000),
    0
  );

  if (expiry > 0) {
    await redis.set(`blacklist:${accessToken}`, "1", { EX: expiry });
  }

  return { message: "Logged out successfully" };
};

exports.refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new Error("No refresh token");
  }

  // Verify refresh token
  const decoded = jwt.verify(refreshToken, publicKey, { algorithms: ["RS256"] });

  const { userId, sessionId } = decoded;
  // Check Redis
  const stored = await redis.get(`refresh:${userId}:${sessionId}`);

  const hashedIncoming = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  if (!stored || stored !== hashedIncoming) {
    throw new Error("Invalid refresh token");
  }

  // Fetch user + roles + permissions
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true }
              }
            }
          }
        }
      }
    }
  });

  if (!user || !user.isActive) {
    throw new Error("User disabled");
  }

  // Extract roles + permissions
  const permissions = user.roles.flatMap(r =>
    r.role.permissions.map(p => `${p.permission.resource}:${p.permission.action}`)
  );

  const roles = user.roles.map(r => r.role.name);

  // Generate new access token
  const accessToken = jwt.sign(
    {
      userId: user.id,
      roles,
      permissions
    },
    privateKey,
    {
      algorithm: "RS256",
      expiresIn: "15m"
    }
  );

  return { accessToken };
};