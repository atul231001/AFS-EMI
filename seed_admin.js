import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();
const generateObjectId = () => crypto.randomBytes(12).toString('hex');

async function seedAdmin() {
  try {
    console.log("Connecting to the database...");

    const fullPermissions = {
      dashboard: { read: true },
      customers: { read: true, create: true, update: true, delete: true },
      machines: { read: true, create: true, update: true, delete: true },
      financing: { read: true, create: true, update: true, delete: true },
      new_financing: { read: true, create: true },
      financed_machines: { read: true, update: true },
      settlements: { read: true, create: true, update: true, delete: true },
      employees: { read: true, create: true, update: true, delete: true },
      settings_parent: { read: true },
      settings_general: { read: true, update: true },
      settings_rbac: { read: true, update: true },
      fmc: { read: true, create: true, update: true, delete: true },
      service_desk: { read: true, create: true, update: true, delete: true }
    };

    let adminRole = await prisma.roles.findFirst({ where: { name: 'Admin' } });
    if (!adminRole) {
      console.log("Creating Admin role...");
      adminRole = await prisma.roles.create({
        data: {
          id: generateObjectId(),
          name: 'Admin',
          description: 'Master Administrator with unrestricted access',
          permissions: fullPermissions,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }

    const email = 'oem@liugong.com';
    const plainPassword = '12345678';
    
    let user = await prisma.users.findFirst({ where: { email } });
    
    if (user) {
      console.log("Admin user already exists. Updating password and role...");
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      await prisma.users.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          roleId: adminRole.id,
          role: 'OEM'
        }
      });
    } else {
      console.log("Creating OEM Admin user...");
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      user = await prisma.users.create({
        data: {
          id: generateObjectId(),
          name: 'OEM Administrator',
          email: email,
          password: hashedPassword,
          role: 'OEM',
          roleId: adminRole.id,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }

    console.log(`Success! You can now log in with ${email} and password: ${plainPassword}`);
  } catch (error) {
    console.error("Error seeding admin:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin();
