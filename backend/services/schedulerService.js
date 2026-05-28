import Loan from '../models/Loan.js';
import SystemConfig from '../models/SystemConfig.js';
import NotificationLog from '../models/NotificationLog.js';
import { sendNotification } from './notificationService.js';

export const runOverdueCheck = async () => {
  console.log('--- STARTING OVERDUE NOTIFICATION SCAN ---');
  try {
    const config = await SystemConfig.findOne();
    if (!config || !config.notifications.overdue_alert) {
      console.log('Overdue alerts are globally disabled.');
      return;
    }

    const intervalDays = config.notifications.overdue_interval || 7;
    const loans = await Loan.find().populate('customerId');

    for (const loan of loans) {
      if (!loan.customerId || !loan.customerId.email) continue;

      const overdueSchedule = (loan.schedule || []).filter(s => s.status === 'Pending' && new Date(s.dueDate) < new Date());
      const overdueAmount = overdueSchedule.reduce((sum, s) => sum + s.emi, 0);

      if (overdueAmount > 0) {
        // Check last log for this loan
        const lastLog = await NotificationLog.findOne({
          event: 'overdue_alert',
          'metadata.loanId': loan._id,
          status: 'Sent'
        }).sort({ createdAt: -1 });

        let shouldSend = false;
        if (!lastLog) {
          shouldSend = true;
        } else {
          const daysSinceLast = (new Date() - new Date(lastLog.createdAt)) / (1000 * 60 * 60 * 24);
          if (daysSinceLast >= intervalDays) {
            shouldSend = true;
          }
        }

        if (shouldSend) {
          console.log(`Sending overdue notice for ${loan.machineName} to ${loan.customerId.email}`);
          await sendNotification('overdue_alert', {
            name: loan.customerId.name,
            email: loan.customerId.email,
            machineName: loan.machineName,
            overdueAmount: overdueAmount.toLocaleString('en-IN'),
            currency: '₹',
            dueDate: overdueSchedule[0].dueDate
          }, { loanId: loan._id, auto: true });
        }
      }
    }
    console.log('--- OVERDUE NOTIFICATION SCAN COMPLETED ---');
  } catch (error) {
    console.error('Scheduler Error:', error);
  }
};

// Initialize Scheduler
export const initScheduler = () => {
  // Run every 24 hours
  setInterval(runOverdueCheck, 24 * 60 * 60 * 1000);
  
  // Also run once on startup after 1 minute to not block server boot
  setTimeout(runOverdueCheck, 60000);
};
