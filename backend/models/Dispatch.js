import mongoose from 'mongoose';

const dispatchSchema = new mongoose.Schema({
  serialNumber: { type: String, required: true, unique: true },
  dispatchId: { type: Number },
  orderId: { type: Number },
  ddFile: { type: String },
  lrNo: { type: String },
  lrFile: { type: String },
  eWayBillNo: { type: String },
  eWayBillFile: { type: String },
  dispatchDate: { type: String },
  deliveryDate: { type: String },
  isDispatched: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Dispatch', dispatchSchema);
