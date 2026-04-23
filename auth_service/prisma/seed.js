require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const bcrypt = require("bcrypt");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

const prisma = new PrismaClient({
  adapter
});

async function main() {
  const hashedPassword = await bcrypt.hash("123456", 10);

  // Permissions
  // const read = await prisma.permission.create({
  //   data: { resource: "orders", action: "read" }
  // });
  const read = await prisma.permission.upsert({
    where: {
      resource_action: {
        resource: "orders",
        action: "read"
      }
    },
    update: {},
    create: { resource: "orders", action: "read" }
  });

  const write = await prisma.permission.upsert({
    where: {
      resource_action: {
        resource: "orders",
        action: "write"
      }
    },
    update: {},
    create: { resource: "orders", action: "write" }
  });

  const del = await prisma.permission.upsert({
    where: {
      resource_action: {
        resource: "orders",
        action: "delete"
      }
    },
    update: {},
    create: { resource: "orders", action: "delete" }
  });

  // Role
  // const admin = await prisma.role.create({
  //   data: {
  //     name: "admin",
  //     permissions: {
  //       create: [
  //         { permissionId: read.id },
  //         { permissionId: write.id },
  //         { permissionId: del.id }
  //       ]
  //     }
  //   }
  // });
  // const admin = await prisma.role.upsert({
  //   where: { name: "admin" },
  //   update: {},
  //   create: {
  //     name: "admin",
  //     permissions: {
  //       create: [
  //         { permissionId: read.id },
  //         { permissionId: write.id },
  //         { permissionId: del.id }
  //       ]
  //     }
  //   }
  // });

  //Admin Role
  const admin = await prisma.role.upsert({
    where: { name: "admin" },
    update: {},
    create: { name: "admin" }
  });

  // Admin read
  await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId: admin.id,
        permissionId: read.id
      }
    },
    update: {},
    create: {
      roleId: admin.id,
      permissionId: read.id
    }
  });

  // Admin write
  await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId: admin.id,
        permissionId: write.id
      }
    },
    update: {},
    create: {
      roleId: admin.id,
      permissionId: write.id
    }
  });

  // Admin delete
  await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId: admin.id,
        permissionId: del.id
      }
    },
    update: {},
    create: {
      roleId: admin.id,
      permissionId: del.id
    }
  });

  // User
  // await prisma.user.create({
  //   data: {
  //     email: "admin@test.com",
  //     password: hashedPassword,
  //     roles: {
  //       create: [{ roleId: admin.id }]
  //     }
  //   }
  // });
  // await prisma.user.upsert({
  //   where: { email: "admin@test.com" },
  //   update: {},
  //   create: {
  //     email: "admin@test.com",
  //     password: hashedPassword,
  //     roles: {
  //       create: [{ roleId: admin.id }]
  //     }
  //   }
  // });
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@test.com" },
    update: {},
    create: {
      email: "admin@test.com",
      password: hashedPassword,
    }
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: admin.id
      }
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: admin.id
    }
  });


  //Manager Role
  const manager = await prisma.role.upsert({
    where: { name: "manager" },
    update: {},
    create: { name: "manager" }
  });

  // Manager read
  await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId: manager.id,
        permissionId: read.id
      }
    },
    update: {},
    create: {
      roleId: manager.id,
      permissionId: read.id
    }
  });

  // Manager write
  await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId: manager.id,
        permissionId: write.id
      }
    },
    update: {},
    create: {
      roleId: manager.id,
      permissionId: write.id
    }
  });

  const managerUser = await prisma.user.upsert({
    where: { email: "manager@test.com" },
    update: {},
    create: {
      email: "manager@test.com",
      password: hashedPassword
    }
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: managerUser.id,
        roleId: manager.id
      }
    },
    update: {},
    create: {
      userId: managerUser.id,
      roleId: manager.id
    }
  });


  const userRole = await prisma.role.upsert({
    where: { name: "user" },
    update: {},
    create: { name: "user" }
  });

  //User read
  await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId: userRole.id,
        permissionId: read.id
      }
    },
    update: {},
    create: {
      roleId: userRole.id,
      permissionId: read.id
    }
  });

  const normalUser = await prisma.user.upsert({
    where: { email: "user@test.com" },
    update: {},
    create: {
      email: "user@test.com",
      password: hashedPassword
    }
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: normalUser.id,
        roleId: userRole.id
      }
    },
    update: {},
    create: {
      userId: normalUser.id,
      roleId: userRole.id
    }
  });
}

main();