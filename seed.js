import mongoose from 'mongoose';
import User from './backend/models/User.js';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Clean existing users first to force password hashing on recreation
  await User.deleteMany({ email: { $in: ['oem@liugong.com', 'customer@test.com'] } });
  console.log('Cleaned old seed users');

  // Create OEM User
  const oem = new User({
    email: 'oem@liugong.com',
    name: 'Liugong OEM Admin',
    password: 'admin123',
    role: 'OEM'
  });
  await oem.save();
  console.log('OEM User created:', oem.email);
  
  // Create a Customer User
  const customer = new User({
    email: 'customer@test.com',
    name: 'John Construction',
    password: 'user123',
    role: 'CUSTOMER'
  });
  await customer.save();
  console.log('Customer User created:', customer.email);
  
  process.exit();
};

seed();
