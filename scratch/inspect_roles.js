import mongoose from 'mongoose';
import Role from '../backend/models/Role.js';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const roles = await Role.find().lean();
  console.log(JSON.stringify(roles, null, 2));
  process.exit(0);
}

run().catch(console.error);
