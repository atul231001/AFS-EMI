import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import User from '../backend/models/User.js';
import Customer from '../backend/models/Customer.js';
import Machine from '../backend/models/Machine.js';
import Loan from '../backend/models/Loan.js';
import Payment from '../backend/models/Payment.js';
import { FMCContract, FMCTicket, FMCSupervisor, FMCDailyHour, FMCInvoice } from '../backend/models/FMC.js';
import TicketStatus from '../backend/models/TicketStatus.js';
import ApprovalFlow from '../backend/models/ApprovalFlow.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/emi_db';

async function run() {
  console.log('Connecting to database:', MONGODB_URI);
  await mongoose.connect(MONGODB_URI);

  // 1. Clear existing collections (excluding OEM admin user to preserve credentials)
  console.log('Cleaning existing collection data...');
  await Customer.deleteMany({});
  await Machine.deleteMany({});
  await Loan.deleteMany({});
  await Payment.deleteMany({});
  await FMCContract.deleteMany({});
  await FMCTicket.deleteMany({});
  await FMCSupervisor.deleteMany({});
  await FMCDailyHour.deleteMany({});
  await FMCInvoice.deleteMany({});
  await TicketStatus.deleteMany({});
  await ApprovalFlow.deleteMany({});
  
  // Clean up all non-OEM-admin users to keep user table clean
  await User.deleteMany({ email: { $nin: ['oem@liugong.com'] } });

  // 2. Fetch OEM Admin user
  const adminUser = await User.findOne({ email: 'oem@liugong.com' });
  if (!adminUser) {
    console.error('OEM Admin user not found. Please run seed.js and scratch/bootstrap.js first.');
    process.exit(1);
  }
  console.log('Found Admin User:', adminUser.email);

  // 3. Create Customers
  console.log('Seeding Customers...');
  const customer1 = await Customer.create({
    name: 'John Construction',
    customId: 'CUST0001',
    mobile: '9876543210',
    email: 'customer@test.com',
    status: 'Active',
    address: '123 Main Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    pin: '400001',
    gst: '27AAAAA1111A1Z1',
    pan: 'ABCDE1234F',
    bankAcc: '1234567890',
    ifsc: 'SBIN0000001',
    company: 'John Construction Ltd.',
    type: 'EMI',
    password: 'user123'
  });

  const customer2 = await Customer.create({
    name: 'Mining Corp',
    customId: 'CUST0002',
    mobile: '9876543222',
    email: 'miningcorp@test.com',
    status: 'Active',
    address: '456 Quarry Road',
    city: 'Ranchi',
    state: 'Jharkhand',
    pin: '834001',
    gst: '20BBBBB2222B2Z2',
    pan: 'FGHIJ5678K',
    bankAcc: '9876543210',
    ifsc: 'ICIC0000002',
    company: 'Mining Corp Private Limited',
    type: 'FMC',
    password: 'user123'
  });

  const customer3 = await Customer.create({
    name: 'L&T Infrastructure',
    customId: 'CUST0003',
    mobile: '9876543233',
    email: 'ltinfra@test.com',
    status: 'Active',
    address: '789 Highway Avenue',
    city: 'New Delhi',
    state: 'Delhi',
    pin: '110001',
    gst: '07CCCCC3333C3Z3',
    pan: 'KLMNO9012L',
    bankAcc: '5678901234',
    ifsc: 'HDFC0000003',
    company: 'Larsen & Toubro Ltd.',
    type: 'Rental',
    password: 'user123'
  });

  // 4. Create Users for Customers (hashed passwords via pre('save') hook)
  console.log('Seeding Customer User Accounts...');
  const user1 = new User({
    name: customer1.name,
    email: customer1.email,
    password: 'user123',
    role: 'CUSTOMER',
    customerId: customer1._id,
    type: customer1.type
  });
  await user1.save();

  const user2 = new User({
    name: customer2.name,
    email: customer2.email,
    password: 'user123',
    role: 'CUSTOMER',
    customerId: customer2._id,
    type: customer2.type
  });
  await user2.save();

  const user3 = new User({
    name: customer3.name,
    email: customer3.email,
    password: 'user123',
    role: 'CUSTOMER',
    customerId: customer3._id,
    type: customer3.type
  });
  await user3.save();

  // Seeding OEM Employees
  console.log('Seeding OEM Employees...');
  const emp1 = new User({
    name: 'tokio',
    customId: 'EMP0007',
    email: 'tokio@liugong.com',
    phone: '3246546521',
    password: 'user123',
    role: 'OEM',
    status: 'Active'
  });
  await emp1.save();

  const emp2 = new User({
    name: 'burlin',
    customId: 'EMP0008',
    email: 'burlin@liugong.com',
    phone: '3216545374',
    password: 'user123',
    role: 'OEM',
    status: 'Active'
  });
  await emp2.save();


  // 5. Create Machines
  console.log('Seeding Machines...');
  const machine1 = await Machine.create({
    machineId: 'LM-112233',
    category: 'Crawler',
    machineType: 'BS VI',
    name: 'LiuGong 922D',
    model: 'CLG922D Excavator',
    brand: 'LiuGong',
    pricing: {
      totalPrice: 6500000,
      oemNetSaleValue: 6000000,
      commissionA: 200000,
      commissionB: 150000,
      serviceCommission: 150000
    },
    warranty: {
      standardMonths: 24,
      standardHours: 5000,
      extendedMonths: 12,
      extendedHours: 2500,
      catalogUrl: '',
      manualUrl: ''
    },
    specs: {
      fuelType: 'Diesel',
      driveType: 'Tracked',
      transmissionType: 'Hydrostatic',
      engineModel: 'Cummins QSB6.7'
    },
    status: 'Assigned'
  });

  const machine2 = await Machine.create({
    machineId: 'LM-445566',
    category: 'Wheeled',
    machineType: 'BS VI',
    name: 'LiuGong 856H',
    model: 'CLG856H Wheel Loader',
    brand: 'LiuGong',
    pricing: {
      totalPrice: 5500000,
      oemNetSaleValue: 5000000,
      commissionA: 180000,
      commissionB: 120000,
      serviceCommission: 120000
    },
    warranty: {
      standardMonths: 12,
      standardHours: 3000,
      extendedMonths: 6,
      extendedHours: 1500,
      catalogUrl: '',
      manualUrl: ''
    },
    specs: {
      fuelType: 'Diesel',
      driveType: '4WD',
      transmissionType: 'CVT',
      engineModel: 'Cummins QSL9.3'
    },
    status: 'Assigned'
  });

  const machine3 = await Machine.create({
    machineId: 'LM-778899',
    category: 'Crawler',
    machineType: 'BS IV',
    name: 'LiuGong 9035E',
    model: 'CLG9035E Mini Excavator',
    brand: 'LiuGong',
    pricing: {
      totalPrice: 2800000,
      oemNetSaleValue: 2500000,
      commissionA: 100000,
      commissionB: 80000,
      serviceCommission: 70000
    },
    specs: {
      fuelType: 'Diesel',
      driveType: 'Tracked',
      transmissionType: 'Manual',
      engineModel: 'Yanmar 3TNV88F'
    },
    status: 'Available'
  });

  const machine4 = await Machine.create({
    machineId: 'LM-223344',
    category: 'Wheeled',
    machineType: 'EV',
    name: 'LiuGong 856H-EV',
    model: 'CLG856H-EV Electric Loader',
    brand: 'LiuGong',
    pricing: {
      totalPrice: 8500000,
      oemNetSaleValue: 8000000,
      commissionA: 250000,
      commissionB: 200000,
      serviceCommission: 180000
    },
    specs: {
      fuelType: 'Electric',
      driveType: '4WD',
      transmissionType: 'Electric Drive',
      batteryCapacity: '350 kWh'
    },
    status: 'Available'
  });

  // 6. Create Loans
  console.log('Seeding Loans & Amortization Schedules...');
  
  // Loan 1 schedule
  const loan1Schedule = [];
  let balance1 = 5000000;
  const emi1 = 250000;
  for (let i = 1; i <= 24; i++) {
    const interest = Math.round(balance1 * (8.5 / 12 / 100));
    const principal = emi1 - interest;
    balance1 = Math.max(0, balance1 - principal);
    
    // Due dates spaced monthly starting from 01/02/2026
    const month = (i % 12) + 1;
    const year = 2026 + Math.floor(i / 12);
    const dueDate = `01/${month.toString().padStart(2, '0')}/${year}`;
    
    loan1Schedule.push({
      installment: i,
      dueDate,
      emi: emi1,
      principal,
      interest,
      balance: balance1,
      status: i <= 4 ? 'Paid' : 'Pending' // First 4 months are paid
    });
  }

  const loan1 = await Loan.create({
    customerId: customer1._id,
    machineName: 'LiuGong 922D Excavator',
    model: 'CLG922D',
    invoiceNumber: 'INV-2026-001',
    serialNumber: 'LM-112233',
    principal: 5000000,
    emi: emi1,
    tenure: 24,
    interestRate: 8.5,
    downPayment: 1500000,
    startDate: '01/01/2026',
    status: 'Active',
    schedule: loan1Schedule
  });

  // Loan 2 schedule
  const loan2Schedule = [];
  let balance2 = 4000000;
  const emi2 = 360000;
  for (let i = 1; i <= 12; i++) {
    const interest = Math.round(balance2 * (9.0 / 12 / 100));
    const principal = emi2 - interest;
    balance2 = Math.max(0, balance2 - principal);
    
    const month = ((i + 1) % 12) + 1;
    const year = 2026 + Math.floor((i + 1) / 12);
    const dueDate = `01/${month.toString().padStart(2, '0')}/${year}`;
    
    loan2Schedule.push({
      installment: i,
      dueDate,
      emi: emi2,
      principal,
      interest,
      balance: balance2,
      status: i <= 3 ? 'Paid' : 'Pending' // First 3 months are paid
    });
  }

  const loan2 = await Loan.create({
    customerId: customer3._id,
    machineName: 'LiuGong 856H Wheel Loader',
    model: 'CLG856H',
    invoiceNumber: 'INV-2026-002',
    serialNumber: 'LM-445566',
    principal: 4000000,
    emi: emi2,
    tenure: 12,
    interestRate: 9.0,
    downPayment: 1500000,
    startDate: '01/02/2026',
    status: 'Active',
    schedule: loan2Schedule
  });

  // 7. Create Payments
  console.log('Seeding Payments...');
  // Loan 1 payments
  await Payment.create({ loanId: loan1._id, amount: emi1, date: '01/02/2026', method: 'Bank Transfer', transactionId: 'TXN-922D-001' });
  await Payment.create({ loanId: loan1._id, amount: emi1, date: '01/03/2026', method: 'Bank Transfer', transactionId: 'TXN-922D-002' });
  await Payment.create({ loanId: loan1._id, amount: emi1, date: '01/04/2026', method: 'Bank Transfer', transactionId: 'TXN-922D-003' });
  await Payment.create({ loanId: loan1._id, amount: emi1, date: '01/05/2026', method: 'Bank Transfer', transactionId: 'TXN-922D-004' });

  // Loan 2 payments
  await Payment.create({ loanId: loan2._id, amount: emi2, date: '01/03/2026', method: 'Bank Transfer', transactionId: 'TXN-856H-001' });
  await Payment.create({ loanId: loan2._id, amount: emi2, date: '01/04/2026', method: 'Bank Transfer', transactionId: 'TXN-856H-002' });
  await Payment.create({ loanId: loan2._id, amount: emi2, date: '01/05/2026', method: 'Bank Transfer', transactionId: 'TXN-856H-003' });

  // 8. Create FMC Supervisors
  console.log('Seeding FMC Supervisors...');
  const supervisor = await FMCSupervisor.create({
    name: 'Supervisor Dave',
    employeeId: 'SUP0001',
    mobile: '9876543255',
    skills: ['Electrical', 'Hydraulics', 'Engine Diagnostics'],
    region: 'Jharkhand Mining Belt',
    status: 'Active',
    shiftStart: '08:00',
    shiftEnd: '17:00',
    assignedEmployees: [emp1._id.toString(), emp2._id.toString()]
  });

  // Create User account for Supervisor Dave
  const superUser = new User({
    name: supervisor.name,
    email: 'supervisor@test.com',
    password: 'user123',
    role: 'SUPERVISOR',
    supervisorId: supervisor._id,
    status: 'Active'
  });
  await superUser.save();
  console.log('Supervisor Dave User Account created:', superUser.email);

  const supervisor2 = await FMCSupervisor.create({
    name: 'profesher',
    employeeId: 'SUP0002',
    mobile: '32146584014654',
    skills: ['Mechanical', 'Welding'],
    region: 'Karnataka',
    status: 'Active',
    shiftStart: '09:00',
    shiftEnd: '18:00',
    assignedEmployees: []
  });

  const superUser2 = new User({
    name: supervisor2.name,
    email: 'pr@liugong.com',
    password: 'user123',
    role: 'SUPERVISOR',
    supervisorId: supervisor2._id,
    status: 'Active'
  });
  await superUser2.save();
  console.log('Supervisor profesher User Account created:', superUser2.email);

  const supervisor3 = await FMCSupervisor.create({
    name: 'Supervisor Sarah',
    employeeId: 'SUP0003',
    mobile: '9876543211',
    skills: ['Hydraulics', 'Diagnostics'],
    region: 'Maharashtra',
    status: 'Active',
    shiftStart: '08:00',
    shiftEnd: '17:00',
    assignedEmployees: []
  });

  const superUser3 = new User({
    name: supervisor3.name,
    email: 'sarah@test.com',
    password: 'user123',
    role: 'SUPERVISOR',
    supervisorId: supervisor3._id,
    status: 'Active'
  });
  await superUser3.save();
  console.log('Supervisor Sarah User Account created:', superUser3.email);

  // 9. Create FMC Contract
  console.log('Seeding FMC Contracts...');
  const contract = await FMCContract.create({
    customerName: customer2.name,
    companyName: customer2.company,
    siteName: 'Ranchi Coal Mine A',
    siteAddress: '456 Quarry Road, Ranchi, Jharkhand',
    contactPerson: 'Operations Head',
    mobile: customer2.mobile,
    email: customer2.email,
    customerId: customer2._id.toString(),
    agreementNumber: 'AGR-FMC-2026-001',
    startDate: '01/01/2026',
    endDate: '31/12/2026',
    billingCycle: 'Monthly',
    machines: [machine1.machineId, machine2.machineId],
    assignedSupervisor: supervisor.name,
    fixedMonthlyCharge: 200000,
    hourlyRate: 1500,
    minBillingHours: 180,
    overtimeRate: 2000,
    breakdownCoverage: true,
    partsIncluded: false,
    consumablesIncluded: true,
    slaResponseTime: 4,
    slaResolutionTime: 48,
    status: 'Active'
  });

  // Associate contract ID to supervisor
  supervisor.contractId = contract._id.toString();
  await supervisor.save();

  // 10. Seeding Ticket Statuses
  console.log('Seeding Ticket Statuses...');
  const status1 = await TicketStatus.create({
    name: 'Requested',
    color: '#3B82F6',
    description: 'The ticket has been raised and is awaiting technical triage.'
  });

  const status2 = await TicketStatus.create({
    name: 'Under Review',
    color: '#F59E0B',
    description: 'Undergoing OEM technical evaluation.'
  });

  const status3 = await TicketStatus.create({
    name: 'Resolved',
    color: '#10B981',
    description: 'The issue has been resolved and is closed.'
  });

  // 11. Seeding Approval Flow
  console.log('Seeding Approval Flow...');
  await ApprovalFlow.create({
    name: 'Standard Mining Site Flow',
    isActive: true,
    supervisorId: supervisor._id.toString(),
    steps: [
      { sequence: 1, approverId: emp1._id, statusId: status2._id },
      { sequence: 2, approverId: emp2._id, statusId: status3._id }
    ]
  });

  // 12. Seeding FMC Tickets
  console.log('Seeding FMC Tickets...');
  await FMCTicket.create({
    ticketNumber: 'TKT-2026-001',
    contractId: contract._id.toString(),
    machineName: 'LiuGong 922D (LM-112233)',
    breakdownType: 'Hydraulics',
    severity: 'High',
    description: 'Hydraulic pump overheating. Main pressure drops under peak load.',
    location: 'Ranchi Coal Mine A - Pit 3',
    hourReading: '1450',
    status: 'Under Review',
    currentStepIndex: 1,
    approvalHistory: [
      {
        approverId: superUser._id,
        approverName: superUser.name,
        status: 'Requested',
        action: 'Created',
        notes: 'Raised breakdown ticket due to pressure drop.',
        timestamp: new Date('2026-05-18T10:00:00Z')
      },
      {
        approverId: adminUser._id,
        approverName: adminUser.name,
        status: 'Under Review',
        action: 'Approved',
        notes: 'Assigned inspection team.',
        timestamp: new Date('2026-05-18T14:30:00Z')
      }
    ]
  });

  await FMCTicket.create({
    ticketNumber: 'TKT-2026-002',
    contractId: contract._id.toString(),
    machineName: 'LiuGong 856H (LM-445566)',
    breakdownType: 'Electrical',
    severity: 'Medium',
    description: 'Alternator charging fault. Battery drains overnight.',
    location: 'Ranchi Coal Mine A - Yard 1',
    hourReading: '1020',
    status: 'Requested',
    currentStepIndex: 0
  });

  // 13. Seeding FMC Daily Hours
  console.log('Seeding FMC Daily Hours...');
  const days = ['2026-05-15', '2026-05-16', '2026-05-17', '2026-05-18', '2026-05-19'];
  for (const day of days) {
    await FMCDailyHour.create({
      date: day,
      machineName: 'LiuGong 922D (LM-112233)',
      contractId: contract._id.toString(),
      supervisorId: supervisor._id.toString(),
      startMeter: 1200 + days.indexOf(day) * 8,
      endMeter: 1200 + (days.indexOf(day) + 1) * 8,
      totalHours: 8,
      idleHours: 1,
      fuelConsumption: 120,
      remarks: 'Normal operation'
    });

    await FMCDailyHour.create({
      date: day,
      machineName: 'LiuGong 856H (LM-445566)',
      contractId: contract._id.toString(),
      supervisorId: supervisor._id.toString(),
      startMeter: 850 + days.indexOf(day) * 6,
      endMeter: 850 + (days.indexOf(day) + 1) * 6,
      totalHours: 6,
      idleHours: 2,
      fuelConsumption: 90,
      remarks: 'Operated in shift A'
    });
  }

  // 14. Seeding FMC Invoices
  console.log('Seeding FMC Invoices...');
  await FMCInvoice.create({
    invoiceNumber: 'INV-FMC-2026-01',
    contractId: contract._id.toString(),
    agreementNumber: contract.agreementNumber,
    customerName: customer2.name,
    billingMonth: 'April 2026',
    totalHours: 220,
    billedHours: 220,
    hourlyRate: 1500,
    fixedCharge: 200000,
    usageCharge: 330000,
    partsCharge: 15000,
    laborCharge: 10000,
    gst: 99900,
    totalAmount: 654900,
    status: 'Paid',
    paidAt: new Date('2026-05-05')
  });

  await FMCInvoice.create({
    invoiceNumber: 'INV-FMC-2026-02',
    contractId: contract._id.toString(),
    agreementNumber: contract.agreementNumber,
    customerName: customer2.name,
    billingMonth: 'May 2026',
    totalHours: 195,
    billedHours: 195,
    hourlyRate: 1500,
    fixedCharge: 200000,
    usageCharge: 292500,
    partsCharge: 0,
    laborCharge: 5000,
    gst: 89550,
    totalAmount: 587050,
    status: 'Pending'
  });

  console.log('✨ All Demo Data successfully seeded!');
  process.exit(0);
}

run().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
