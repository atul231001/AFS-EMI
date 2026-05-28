import mongoose from 'mongoose';
import NotificationTemplate from '../../../backend/models/NotificationTemplate.js';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

const seedOverdueTemplate = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const overdueTemplate = {
      event: 'overdue_alert',
      name: 'Overdue Payment Alert',
      subject: 'URGENT: Overdue Payment for {{machineName}}',
      body: `Dear {{name}},\n\nThis is a formal notification regarding an overdue payment for your asset: {{machineName}}.\n\nTotal Overdue Amount: {{currency}}{{overdueAmount}}\nNext EMI Due Date: {{dueDate}}\n\nPlease settle the outstanding balance immediately to avoid machine lockout protocols or legal action.\n\nYou can log in to the portal to view your detailed ledger: {{loginUrl}}\n\nThank you,\nLiuGong Finance Recovery Team`,
      variables: [
        { key: 'name', label: 'Customer Name' },
        { key: 'machineName', label: 'Asset Name' },
        { key: 'overdueAmount', label: 'Amount' },
        { key: 'currency', label: 'Currency Symbol' },
        { key: 'dueDate', label: 'Original Due Date' }
      ],
      enabled: true,
      channels: ['email']
    };

    await NotificationTemplate.findOneAndUpdate(
      { event: 'overdue_alert' },
      overdueTemplate,
      { upsert: true, new: true }
    );

    console.log('Overdue notification template seeded successfully.');
    process.exit();
  } catch (error) {
    console.error('Seeding Error:', error);
    process.exit(1);
  }
};

seedOverdueTemplate();
