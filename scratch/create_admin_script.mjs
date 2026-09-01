import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();
const generateObjectId = () => crypto.randomBytes(12).toString('hex');

async function createAdmin() {
  try {
    const email = 'oem@liugong.com';
    const password = '12345678';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user already exists
    let user = await prisma.users.findFirst({ where: { email } });

    if (user) {
      console.log('User already exists, updating password...');
      await prisma.users.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });
      console.log('Admin user updated successfully.');
    } else {
      console.log('Creating new admin user...');
      await prisma.users.create({
        data: {
          id: generateObjectId(),
          name: 'OEM Admin',
          email: email,
          password: hashedPassword,
          role: 'OEM',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      console.log('Admin user created successfully.');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
