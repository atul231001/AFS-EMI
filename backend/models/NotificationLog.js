import mongoose from 'mongoose';

const notificationLogSchema = new mongoose.Schema({
  event: { type: String, required: true },
  channel: { type: String, required: true }, // 'email', 'sms', etc.
  recipient: { type: String, required: true }, // email address or phone number
  subject: String,
  body: String,
  status: { type: String, enum: ['Pending', 'Sent', 'Failed'], default: 'Pending' },
  error: String,
  metadata: mongoose.Schema.Types.Mixed, // Any additional data (e.g., entity IDs)
  retryCount: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('NotificationLog', notificationLogSchema);
