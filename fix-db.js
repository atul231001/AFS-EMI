import mongoose from 'mongoose';
import Loan from './backend/models/Loan.js';

async function fix() {
  await mongoose.connect('mongodb://project_emi:mFZZI94FVjWn4tdR@ac-pilur9b-shard-00-00.egu1mey.mongodb.net:27017,ac-pilur9b-shard-00-01.egu1mey.mongodb.net:27017,ac-pilur9b-shard-00-02.egu1mey.mongodb.net:27017/mydatabase?ssl=true&replicaSet=atlas-5ihvjw-shard-0&authSource=admin&retryWrites=true&w=majority');
  const result = await Loan.updateMany(
    { approvalStatus: 'Active', invoiceUrl: { $exists: true }, dispatchDate: null },
    { $set: { approvalStatus: 'Pending Dispatch' } }
  );
  console.log('Updated:', result.modifiedCount);
  process.exit(0);
}
fix();
