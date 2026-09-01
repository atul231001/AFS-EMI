import { PrismaClient } from '@prisma/client';
import fs from 'fs';
const prisma = new PrismaClient();

async function migrateMore() {
  const data = JSON.parse(fs.readFileSync('./backend/mongodb_sample.json', 'utf8'));

  if (data.roles) {
    for (const r of data.roles) {
      await prisma.roles.upsert({
        where: { id: r._id },
        update: {},
        create: {
          id: r._id,
          name: r.name,
          permissions: r.permissions ? JSON.stringify(r.permissions) : null
        }
      });
    }
    console.log('Roles migrated');
  }
  
  if (data.ticketstatuses) {
    for (const t of data.ticketstatuses) {
      await prisma.ticketstatuses.upsert({
        where: { id: t._id },
        update: {},
        create: {
          id: t._id,
          name: t.name,
          color: t.color,
          description: t.description,
          allowedUsers: t.allowedUsers ? JSON.stringify(t.allowedUsers) : null
        }
      });
    }
    console.log('Ticket Statuses migrated');
  }

  console.log('Extra migration completed.');
  process.exit(0);
}

migrateMore().catch(console.error);
