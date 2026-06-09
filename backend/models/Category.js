import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  cat_id: { type: Number, required: true, unique: true },
  cat_name: { type: String, required: true },
  rawData: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

export default mongoose.model('Category', categorySchema);
