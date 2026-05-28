import mongoose from 'mongoose';

const ticketStatusSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  color: { type: String, default: '#f0883e' },
  description: { type: String },
  allowedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] // "admin decide who can give which status"
}, { timestamps: true });

export default mongoose.model('TicketStatus', ticketStatusSchema);
