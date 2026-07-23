import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  loanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan', required: true },
  amount: Number,
  date: { type: String, required: true },
  method: String,
  transactionId: String,
  allocations: [{
    installmentNo: Number,
    type: { type: String, enum: ['Principal', 'OverdueInterest', 'Waived Interest'] },
    amount: Number
  }],
  waiveInterest: Boolean,
  waiverReason: String,
  waiveInstallmentNo: Number,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['Settled', 'Revoked'], default: 'Settled' },
  revokeRemark: String
}, { timestamps: true });

export default mongoose.model('Payment', paymentSchema);
