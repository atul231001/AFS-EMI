import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const Loan = (await import('./backend/models/Loan.js')).default;
    const loans = await Loan.find({}).lean();
    for (let loan of loans) {
      console.log(`Loan ID: ${loan._id}, Machine Name: ${loan.machineName}, Cust ID: ${loan.customerId}`);
    }
    process.exit(0);
  })
  .catch(err => console.error(err));
