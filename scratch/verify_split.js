import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Customer from '../backend/models/Customer.js';
import User from '../backend/models/User.js';

dotenv.config({ path: './backend/.env' });

async function verify() {
  console.log('Connecting to database:', process.env.MONGODB_URI);
  await mongoose.connect(process.env.MONGODB_URI);

  console.log('\n--- VERIFYING CUSTOMERS ---');
  const customers = await Customer.find({});
  customers.forEach(c => {
    console.log(`Customer: "${c.name}" | Type: "${c.type}" | Status: "${c.status}"`);
  });

  console.log('\n--- VERIFYING USER ACCOUNTS ---');
  const users = await User.find({ role: 'CUSTOMER' });
  users.forEach(u => {
    console.log(`User: "${u.name}" | Email: "${u.email}" | Type: "${u.type}"`);
  });

  console.log('\n--- VERIFYING DEFAULT BEHAVIOR ---');
  // Create a temporary customer without a type
  const tempCustomer = new Customer({
    name: 'Temporary Entity',
    customId: 'TEMP_TEST_99'
  });
  console.log(`New temporary customer default type matches 'EMI': ${tempCustomer.type === 'EMI' ? '✅ SUCCESS' : '❌ FAILED'}`);

  await mongoose.disconnect();
}

verify().catch(console.error);
