import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../backend/models/User.js';
import TicketStatus from '../backend/models/TicketStatus.js';
import ApprovalFlow from '../backend/models/ApprovalFlow.js';

dotenv.config({ path: './backend/.env' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const flows = await ApprovalFlow.find().populate('steps.approverId').populate('steps.statusId').lean();
  console.log(JSON.stringify(flows, null, 2));
  process.exit(0);
}

run().catch(console.error);
