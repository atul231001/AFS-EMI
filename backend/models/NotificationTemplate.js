import mongoose from 'mongoose';

const notificationTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // e.g., 'Welcome Email (Customer)'
  event: { type: String, required: true, unique: true }, // e.g., 'customer_welcome'
  subject: { type: String, required: true },
  body: { type: String, required: true }, // HTML content
  variables: [{
    key: String, // e.g., '{{customer_name}}'
    label: String, // e.g., 'Customer Name'
    description: String
  }],
  enabled: { type: Boolean, default: true },
  channels: { type: [String], default: ['email'] }, // 'email', 'sms', 'whatsapp'
}, { timestamps: true });

export default mongoose.model('NotificationTemplate', notificationTemplateSchema);
