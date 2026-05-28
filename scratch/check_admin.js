import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../backend/models/User.js';

dotenv.config({ path: './backend/.env' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOne({ email: 'oem@liugong.com' }).lean();
  console.log(JSON.stringify(user, null, 2));
  process.exit(0);
}

run().catch(console.error);
