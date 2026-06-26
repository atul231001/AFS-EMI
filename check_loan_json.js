import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const Loan = (await import('./backend/models/Loan.js')).default;
    const loan = await Loan.findById('6a3a140ed7f736bd78a9f20d').lean();
    console.log(JSON.stringify(loan, null, 2));
    process.exit(0);
  })
  .catch(err => console.error(err));
