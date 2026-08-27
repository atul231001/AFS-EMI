import prisma from '../backend/config/prisma.js';

async function test() {
  try {
    const machines = await prisma.machines.findMany({
      select: {
        _id: true,
        name: true,
      }
    });
    console.log("Found machines:", machines);
  } catch (error) {
    console.error("Prisma error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
