import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  loanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan', required: true },
  amount: Number,
  date: { type: String, required: true },
  method: String,
  transactionId: String
}, { timestamps: true });

export default mongoose.model('Payment', paymentSchema);
