import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../backend/models/User.js';
import TicketStatus from '../backend/models/TicketStatus.js';
import ApprovalFlow from '../backend/models/ApprovalFlow.js';
import { FMCTicket } from '../backend/models/FMC.js';

dotenv.config({ path: './backend/.env' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/emi_db');
  console.log('connected to database');

  // Find OEM Admin
  const adminUser = await User.findOne({ email: 'oem@liugong.com' });
  if (!adminUser) {
    console.error('OEM admin user not found');
    process.exit(1);
  }
  console.log('Found Admin User:', adminUser.name, adminUser._id);

  // Clear previous test records
  await TicketStatus.deleteMany({ name: 'Test Under Review' });
  await ApprovalFlow.deleteMany({ name: 'Test Verification Chain' });
  await FMCTicket.deleteMany({ ticketNumber: 'TKT-TESTING' });

  // 1. Create a Custom Status
  const testStatus = await TicketStatus.create({
    name: 'Test Under Review',
    color: '#ffa657',
    description: 'This ticket is undergoing technical review by the OEM managers.',
    allowedUsers: [adminUser._id]
  });
  console.log('Custom Status created:', testStatus.name, testStatus._id);

  // 2. Create an Approval Flow
  const testFlow = await ApprovalFlow.create({
    name: 'Test Verification Chain',
    isActive: true,
    steps: [
      {
        sequence: 1,
        approverId: adminUser._id,
        statusId: testStatus._id
      }
    ]
  });
  console.log('Approval Flow created:', testFlow.name, testFlow._id);

  // 3. Create a Ticket (simulate supervisor raising a ticket)
  const ticket = await FMCTicket.create({
    ticketNumber: 'TKT-TESTING',
    contractId: 'dummy-contract',
    machineName: 'Liugong 922D',
    breakdownType: 'Hydraulic',
    severity: 'High',
    description: 'Main pump pressure failure.',
    location: 'Mine A',
    hourReading: '1250',
    status: 'Requested',
    currentStepIndex: 0
  });
  console.log('FMC Ticket created:', ticket.ticketNumber, 'Status:', ticket.status, 'Step Index:', ticket.currentStepIndex);

  // 4. Simulate approval request
  console.log('Simulating step 1 approval by admin...');
  const currentStep = testFlow.steps[ticket.currentStepIndex];
  if (!currentStep) {
    console.error('Step not found');
    process.exit(1);
  }

  // Update status and advance step index
  ticket.status = testStatus.name;
  ticket.currentStepIndex += 1;
  ticket.approvalHistory.push({
    approverId: adminUser._id,
    approverName: adminUser.name,
    status: testStatus.name,
    action: 'Approved',
    notes: 'Verified. Pressure levels are outside specs.'
  });

  const updatedTicket = await ticket.save();
  console.log('Approval Successful!');
  console.log('Updated Ticket Status:', updatedTicket.status);
  console.log('Updated Step Index:', updatedTicket.currentStepIndex);
  console.log('Approval History Logs:', JSON.stringify(updatedTicket.approvalHistory, null, 2));

  // Clean up test records
  await TicketStatus.findByIdAndDelete(testStatus._id);
  await ApprovalFlow.findByIdAndDelete(testFlow._id);
  await FMCTicket.findByIdAndDelete(updatedTicket._id);
  console.log('Cleanup finished.');

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
