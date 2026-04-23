const prisma = require("../utils/prisma");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const redis = require("../utils/redis");

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

  if (!user.isActive) {
    throw new Error("User is disabled");
  }

  // 2. Check password
  const isValid = await bcrypt.compare(password, user.password);

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

  // Refresh Token (long-lived)
  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  // Store refresh token in Redis
  await redis.set(`refresh:${user.id}`, refreshToken, {
    EX: 7 * 24 * 60 * 60 // 7 days
  });

  return {
    accessToken,
    refreshToken
  };
};

exports.logoutUser = async (token) => {
  if (!token) {
    throw new Error("No token provided");
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  if (!decoded || !decoded.exp) {
    throw new Error("Invalid token");
  }

  // Delete refresh token
  await redis.del(`refresh:${decoded.userId}`);

  // Blacklist access token
  const expiry = Math.max(
    decoded.exp - Math.floor(Date.now() / 1000),
    0
  );

  if (expiry <= 0) {
    throw new Error("Token already expired");
  }

  // store in Redis blacklist
  await redis.set(`blacklist:${token}`, "1", {
    EX: expiry
  });

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

  // Check Redis
  const stored = await redis.get(`refresh:${decoded.userId}`);

  if (!stored || stored.trim() !== refreshToken.trim()) {
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