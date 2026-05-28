import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Customer from '../backend/models/Customer.js';

dotenv.config({ path: './backend/.env' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const customers = await Customer.find({}).lean();
  console.log(JSON.stringify(customers.map(c => ({ name: c.name, type: c.type })), null, 2));
  process.exit(0);
}

run().catch(console.error);
