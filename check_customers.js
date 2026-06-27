import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/afs-emi')
  .then(async () => {
    const Customer = (await import('./backend/models/Customer.js')).default;
    const customers = await Customer.find({});
    console.log(`Found ${customers.length} customers.`);
    if (customers.length > 0) {
      console.log('Sample customer:', customers[0]);
    }
    process.exit(0);
  })
  .catch(err => console.error(err));
