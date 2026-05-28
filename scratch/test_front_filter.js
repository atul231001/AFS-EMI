import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../backend/models/User.js';
import { FMCContract, FMCSupervisor } from '../backend/models/FMC.js';
import Machine from '../backend/models/Machine.js';

dotenv.config({ path: './backend/.env' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  const users = await User.find({ role: 'SUPERVISOR' }).lean();
  const fmcSupervisors = await FMCSupervisor.find().lean();
  const fmcContracts = await FMCContract.find().lean();
  const machines = await Machine.find().lean();

  console.log(`Loaded ${users.length} supervisor users`);
  console.log(`Loaded ${fmcSupervisors.length} supervisors`);
  console.log(`Loaded ${fmcContracts.length} contracts`);
  console.log(`Loaded ${machines.length} machines`);

  for (const user of users) {
    console.log(`\n=== Testing for User: ${user.email} (Role: ${user.role}) ===`);
    const supervisorIdStr = user.supervisorId ? user.supervisorId.toString() : '';
    const supervisorObj = fmcSupervisors.find(s => s._id.toString() === supervisorIdStr);
    const supervisorName = supervisorObj ? supervisorObj.name : '';

    console.log(`supervisorIdStr: "${supervisorIdStr}"`);
    console.log(`supervisorName: "${supervisorName}"`);

    const availableContracts = fmcContracts.filter(c =>
      c.assignedSupervisor === supervisorName ||
      c.backupSupervisor === supervisorName ||
      c.assignedSupervisor === supervisorIdStr ||
      c.backupSupervisor === supervisorIdStr ||
      (supervisorObj && supervisorObj.contractId && c._id.toString() === supervisorObj.contractId.toString())
    );

    console.log(`availableContracts count: ${availableContracts.length}`);
    if (availableContracts.length > 0) {
      console.log('Matched Contracts:', availableContracts.map(c => c.agreementNumber));
    }

    const assignedMachineIds = availableContracts.flatMap(c => c.machines || []);
    console.log(`assignedMachineIds:`, assignedMachineIds);

    const availableMachines = machines.filter(m => 
      assignedMachineIds.includes(m._id.toString()) || 
      assignedMachineIds.includes(m.name) || 
      assignedMachineIds.includes(m.machineId)
    );

    console.log(`availableMachines count: ${availableMachines.length}`);
    if (availableMachines.length > 0) {
      console.log('Matched Machines:', availableMachines.map(m => m.name));
    }
  }

  process.exit(0);
}

run().catch(console.error);
