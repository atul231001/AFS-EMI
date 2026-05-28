import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { FMCSupervisor } from '../backend/models/FMC.js';

dotenv.config({ path: './backend/.env' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const supervisors = await FMCSupervisor.find().lean();
  console.log(JSON.stringify(supervisors, null, 2));
  process.exit(0);
}

run().catch(console.error);
