import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();
const generateObjectId = () => crypto.randomBytes(12).toString('hex');

async function seedFresh() {
  try {
    console.log("Connecting to Railway database...");

    // 1. Check/Create System Config
    let config = await prisma.systemconfigs.findFirst();
    if (!config) {
      console.log("Creating default System Configuration...");
      config = await prisma.systemconfigs.create({
        data: {
          id: generateObjectId(),
          categories: ["WHEEL LOADER", "EXCAVATOR", "COMPACTOR", "MOTOR GRADER", "BULLDOZER", "BACKHOE LOADER", "SKID STEER LOADER", "FORKLIFT"],
          dieselTypes: ["Regular", "Premium", "Bio-Diesel"],
          evTypes: ["Battery", "Plug-in Hybrid"],
          transmissionTypes: ["Manual", "Automatic", "Hydrostatic", "Powershift"],
          numbering: {
            customer: { mode: "Auto", prefix: "CUST", nextNumber: 1 },
            employee: { mode: "Auto", prefix: "EMP", nextNumber: 1 },
            supervisor: { mode: "Auto", prefix: "SUP", nextNumber: 1 }
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    } else {
      console.log("System Config already exists.");
    }

    // 2. Check/Create Categories
    const categoriesList = [
      { id: 1, name: "WHEEL LOADER" },
      { id: 2, name: "EXCAVATOR" },
      { id: 3, name: "COMPACTOR" },
      { id: 4, name: "MOTOR GRADER" },
      { id: 5, name: "BULLDOZER" }
    ];

    for (let cat of categoriesList) {
      const existing = await prisma.categories.findFirst({ where: { cat_name: cat.name } });
      if (!existing) {
        console.log(`Creating category: ${cat.name}`);
        await prisma.categories.create({
          data: {
            id: generateObjectId(),
            cat_id: cat.id,
            cat_name: cat.name,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      }
    }

    console.log("✅ Seed completed successfully! You can now create customers and machines without errors.");
  } catch (error) {
    console.error("Error seeding fresh data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedFresh();
