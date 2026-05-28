import mongoose from 'mongoose';

// ── FMC Contract ────────────────────────────────────────────────────────────
const FMCContractSchema = new mongoose.Schema({
  customerName: String,
  companyName: String,
  siteName: String,
  siteAddress: String,
  contactPerson: String,
  mobile: String,
  email: String,
  customerId: String,
  agreementNumber: { type: String, unique: true },
  startDate: String,
  endDate: String,
  billingCycle: { type: String, default: 'Monthly' },
  machines: [String],
  assignedSupervisor: String,
  backupSupervisor: String,
  fixedMonthlyCharge: { type: Number, default: 0 },
  hourlyRate: { type: Number, default: 0 },
  minBillingHours: { type: Number, default: 200 },
  overtimeRate: { type: Number, default: 0 },
  breakdownCoverage: { type: Boolean, default: true },
  partsIncluded: { type: Boolean, default: false },
  consumablesIncluded: { type: Boolean, default: false },
  slaResponseTime: { type: Number, default: 2 },
  slaResolutionTime: { type: Number, default: 24 },
  status: { type: String, default: 'Active' }
}, { timestamps: true });

// ── FMC Breakdown Ticket ────────────────────────────────────────────────────
const FMCTicketSchema = new mongoose.Schema({
  ticketNumber: { type: String, unique: true },
  contractId: String,
  machineName: String,
  breakdownType: String,
  severity: { type: String, default: 'Medium' },
  description: String,
  location: String,
  hourReading: String,
  status: { type: String, default: 'Open' },
  photos: [String],
  resolvedAt: Date,
  resolvedBy: String,
  resolutionNotes: String,
  currentStepIndex: { type: Number, default: 0 },
  supervisorId: { type: String, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvalHistory: [{
    approverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approverName: String,
    status: String,
    action: String,
    notes: String,
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// ── FMC Supervisor ─────────────────────────────────────────────────────────
const FMCSupervisorSchema = new mongoose.Schema({
  name: String,
  employeeId: String,
  mobile: String,
  skills: [String],
  region: String,
  status: { type: String, default: 'Active' },
  contractId: String,
  shiftStart: String,
  shiftEnd: String,
  assignedEmployees: [String]
}, { timestamps: true });

// ── FMC Daily Hours ────────────────────────────────────────────────────────
const FMCDailyHourSchema = new mongoose.Schema({
  date: String,
  machineName: String,
  contractId: String,
  supervisorId: String,
  startMeter: Number,
  endMeter: Number,
  totalHours: { type: Number, default: 0 },
  idleHours: { type: Number, default: 0 },
  fuelConsumption: Number,
  remarks: String
}, { timestamps: true });

// ── FMC Invoice ────────────────────────────────────────────────────────────
const FMCInvoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, unique: true },
  contractId: String,
  agreementNumber: String,
  customerName: String,
  billingMonth: String,
  totalHours: { type: Number, default: 0 },
  billedHours: { type: Number, default: 0 },
  hourlyRate: { type: Number, default: 0 },
  fixedCharge: { type: Number, default: 0 },
  usageCharge: { type: Number, default: 0 },
  partsCharge: { type: Number, default: 0 },
  laborCharge: { type: Number, default: 0 },
  gst: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  status: { type: String, default: 'Pending' },
  paidAt: Date
}, { timestamps: true });

export const FMCContract = mongoose.model('FMCContract', FMCContractSchema);
export const FMCTicket = mongoose.model('FMCTicket', FMCTicketSchema);
export const FMCSupervisor = mongoose.model('FMCSupervisor', FMCSupervisorSchema);
export const FMCDailyHour = mongoose.model('FMCDailyHour', FMCDailyHourSchema);
export const FMCInvoice = mongoose.model('FMCInvoice', FMCInvoiceSchema);
