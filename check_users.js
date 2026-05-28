import mongoose from 'mongoose';
import User from './backend/models/User.js';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

async function checkUsers() {
  await mongoose.connect(process.env.MONGODB_URI);
  const users = await User.find();
  console.log('Users in DB:', users.map(u => ({ email: u.email, role: u.role })));
  process.exit();
}

checkUsers();
