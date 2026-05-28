import mongoose from 'mongoose';
import Customer from './backend/models/Customer.js';
import User from './backend/models/User.js';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/emi_system';

async function syncPasswords() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const customers = await Customer.find();
    console.log(`Found ${customers.length} customers`);

    for (const customer of customers) {
      if (!customer.email) continue;

      const namePart = (customer.name || 'USER').substring(0, 4).toLowerCase().replace(/\s/g, '');
      const mobilePart = (customer.mobile || '0000').slice(-4);
      const defaultPassword = namePart + mobilePart;

      console.log(`Syncing: ${customer.name} | Pass: ${defaultPassword}`);

      let user = await User.findOne({ customerId: customer._id });
      if (!user) {
        user = new User({
          customerId: customer._id,
          name: customer.name,
          email: customer.email,
          password: defaultPassword,
          role: 'CUSTOMER'
        });
      } else {
        user.name = customer.name;
        user.email = customer.email;
        user.password = defaultPassword;
        user.role = 'CUSTOMER';
      }
      await user.save();
    }

    console.log('All passwords synced successfully');
    process.exit(0);
  } catch (error) {
    console.error('Sync failed:', error);
    process.exit(1);
  }
}

syncPasswords();
