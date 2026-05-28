import mongoose from 'mongoose';

const loanSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  machineName: String,
  model: String,
  invoiceNumber: String,
  serialNumber: String,
  startDate: { type: String, default: () => new Date().toLocaleDateString('en-IN') },
  principal: Number,
  emi: Number,
  tenure: Number,
  interestRate: Number,
  downPayment: Number,
  delayInterest: { type: Number, default: 0 },
  status: { type: String, default: 'Active' },
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
