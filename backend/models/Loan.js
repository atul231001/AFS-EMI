import mongoose from 'mongoose';

const loanSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  machineName: String,
  model: String,
  invoiceNumber: String,
  emiStartDate: String,
  startDate: { type: String, default: () => new Date().toLocaleDateString('en-IN') },
  principal: Number,
  emi: Number,
  tenure: Number,
  interestRate: Number,
  downPayment: Number,
  machinePrice: Number,
  discountAmount: Number,
  discountPercentage: Number,
  delayInterest: { type: Number, default: 0 },
  selectedAttachments: [{
    name: String,
    amount: Number,
    isStandard: Boolean
  }],
  manualCharges: [{
    name: String,
    amount: Number
  }],
  status: { type: String, default: 'Active' },
  approvalStatus: { type: String, default: 'Pending Approval' },
  approvalHistory: [{
    action: String,
    notes: String,
    approverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approverName: String,
    status: String,
    date: { type: Date, default: Date.now }
  }],
  approvalStep: { type: Number, default: 0 },
  approvalFlowId: { type: mongoose.Schema.Types.ObjectId, ref: 'ApprovalFlow' },
  agreementGenerated: { type: Boolean, default: false },
  agreementUrl: { type: String },
  invoiceNumber: { type: String },
  invoiceData: { type: Object },
  invoiceUrl: { type: String },
  serialNumber: { type: String },
  dispatchDate: { type: String },
  dispatchData: { type: Object },
  commissionDate: { type: String },
  schedule: [{
    installment: Number,
    dueDate: String,
    emi: Number,
    principal: Number,
    interest: Number,
    balance: Number,
    status: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' }
  }]
}, { timestamps: true });

export default mongoose.model('Loan', loanSchema);
