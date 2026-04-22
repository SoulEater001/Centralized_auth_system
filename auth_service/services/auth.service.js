const prisma = require("../utils/prisma");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

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

  // 4. Create token
  const token = jwt.sign(
    {
      userId: user.id,
      roles,
      permissions
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  return { token };
};