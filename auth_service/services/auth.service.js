const prisma = require("../utils/prisma");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const redis = require("../utils/redis");
const crypto = require("crypto");

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
    throw new Error("Invalid credentials");
  }
  console.log("User found:", user);

  if (!user.isActive) {
    throw new Error("User is disabled");
  }

  // 2. Check password
  const isValid = await bcrypt.compare(password, user.password);
  console.log("Password match:", isValid);
  if (!isValid) {
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
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  const sessionId = crypto.randomUUID();
  // Refresh Token (long-lived)
  const refreshToken = jwt.sign(
    { userId: user.id, sessionId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  const hashedToken = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  // Store refresh token in Redis
  await redis.set(`refresh:${user.id}:${sessionId}`, hashedToken, {
    EX: 7 * 24 * 60 * 60 // 7 days
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

  const decodedAccess = jwt.verify(accessToken, process.env.JWT_SECRET);
  const decodedRefresh = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

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
  const decoded = jwt.verify(
    refreshToken,
    process.env.JWT_REFRESH_SECRET
  );

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
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  return { accessToken };
};