import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { FMCContract } from '../backend/models/FMC.js';
import Machine from '../backend/models/Machine.js';

dotenv.config({ path: './backend/.env' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const contracts = await FMCContract.find().lean();
  const machines = await Machine.find().lean();
  console.log('--- CONTRACTS ---');
  console.log(JSON.stringify(contracts, null, 2));
  console.log('--- MACHINES ---');
  console.log(JSON.stringify(machines.map(m => ({ _id: m._id, machineId: m.machineId, name: m.name })), null, 2));
  process.exit(0);
}

run().catch(console.error);
