import mongoose from 'mongoose';

const approvalFlowStepSchema = new mongoose.Schema({
  sequence: { type: Number, required: true },
  approverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  statusId: { type: mongoose.Schema.Types.ObjectId, ref: 'TicketStatus', required: true }
});

const approvalFlowSchema = new mongoose.Schema({
  name: { type: String, default: 'Default Ticket Approval Flow' },
  steps: [approvalFlowStepSchema],
  isActive: { type: Boolean, default: true },
  supervisorId: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('ApprovalFlow', approvalFlowSchema);
