import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017');
  const admin = mongoose.connection.db.admin();
  const dbs = await admin.listDatabases();
  console.log('Available Databases:', dbs.databases);
  process.exit(0);
}

run().catch(console.error);
