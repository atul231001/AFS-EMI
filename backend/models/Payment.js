import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  loanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan', required: true },
  amount: Number,
  date: { type: String, required: true },
  method: String,
  transactionId: String,
  allocations: [{
    installmentNo: Number,
    type: { type: String, enum: ['Principal', 'OverdueInterest'] },
    amount: Number
  }],
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('Payment', paymentSchema);
