import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './backend/models/User.js';

dotenv.config({ path: './backend/.env' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/emi_db');
  const users = await User.find({}).lean();
  console.log(JSON.stringify(users, null, 2));
  process.exit(0);
}

run().catch(console.error);
