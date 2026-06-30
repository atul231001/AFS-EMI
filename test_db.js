import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/afs-emi').then(async () => {
  const Loan = mongoose.model('Loan', new mongoose.Schema({ machineName: String, model: String }), 'loans');
  const Machine = mongoose.model('Machine', new mongoose.Schema({ name: String, model: String }), 'machines');

  const loans = await Loan.find({}, 'machineName model').lean();
  console.log('--- LOANS ---');
  console.log(loans);

  const machines = await Machine.find({}, 'name model').lean();
  console.log('--- MACHINES ---');
  console.log(machines.slice(0, 10)); // just print a few

  mongoose.disconnect();
});
