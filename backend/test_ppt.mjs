import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });
import { generatePPTReport } from './services/reportService.js';
import Loan from './models/Loan.js';
import Customer from './models/Customer.js'; // to ensure it's registered

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  const loan = await Loan.findOne({}).populate('customerId');
  if (loan) {
    const allLoans = await Loan.find({ customerId: loan.customerId._id }).populate('customerId');
    try {
      await generatePPTReport(loan, allLoans);
      console.log('Success!');
    } catch(err) {
      console.error('Error generating PPT:', err);
    }
  } else {
    console.log('No loan found');
  }
  process.exit();
}
test();
