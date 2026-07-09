import mongoose from 'mongoose';
import fs from 'fs';
import Loan from '../backend/models/Loan.js';
import Customer from '../backend/models/Customer.js';
import { generateAgreementPDF } from '../backend/services/pdfService.js';

const MONGODB_URI = "mongodb://project_emi:mFZZI94FVjWn4tdR@ac-pilur9b-shard-00-00.egu1mey.mongodb.net:27017,ac-pilur9b-shard-00-01.egu1mey.mongodb.net:27017,ac-pilur9b-shard-00-02.egu1mey.mongodb.net:27017/mydatabase?ssl=true&replicaSet=atlas-5ihvjw-shard-0&authSource=admin&retryWrites=true&w=majority";

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to DB');
  
  // Find a loan that has customer document matched
  const loans = await Loan.find({}).populate('customerId');
  const loan = loans.find(l => l.customerId);
  
  if (!loan) {
    console.error('No loan with populated customer found in DB');
    process.exit(1);
  }
  
  console.log(`Generating PDF for loan ${loan._id} (customer: ${loan.customerId.name})...`);
  try {
    const pdfBuffer = await generateAgreementPDF(loan);
    const filename = `scratch/Agreement_Test_${loan._id}.pdf`;
    fs.writeFileSync(filename, pdfBuffer);
    console.log(`Success! PDF saved to ${filename}`);
  } catch (err) {
    console.error('PDF Generation failed:', err);
  }
  
  process.exit(0);
}

run().catch(console.error);
