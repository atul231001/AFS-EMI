import mongoose from 'mongoose';

const bulkUploadLogSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  uploadDate: { type: Date, default: Date.now },
  totalRecords: { type: Number, required: true },
  successfulRecords: { type: Number, required: true },
  failedRecords: { type: Number, required: true },
  uploadErrors: [{
    rowNumber: Number,
    invoiceNumber: String,
    emiNumber: Number,
    errorMessage: String
  }]
}, { timestamps: true });

export default mongoose.model('BulkUploadLog', bulkUploadLogSchema);
