import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../backend/models/User.js';

dotenv.config({ path: './backend/.env' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const users = await User.find({ role: 'SUPERVISOR' }).lean();
  console.log(JSON.stringify(users, null, 2));
  process.exit(0);
}

run().catch(console.error);
