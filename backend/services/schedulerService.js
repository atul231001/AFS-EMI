import { PrismaClient } from '@prisma/client';
import { sendNotification } from './notificationService.js';

const prisma = new PrismaClient();

export const runOverdueCheck = async () => {
  console.log('--- STARTING OVERDUE NOTIFICATION SCAN ---');
  try {
    const config = await prisma.systemconfigs.findFirst();
    if (!config || !config.notifications || !config.notifications.overdue_alert) {
      console.log('Overdue alerts are globally disabled.');
      return;
    }

    const intervalDays = config.notifications.overdue_interval || 7;
    const loans = await prisma.loans.findMany();

    for (const loan of loans) {
      if (!loan.customerId) continue;
      
      // Fetch customer manually since there is no Prisma relation defined
      const customer = await prisma.customers.findUnique({
        where: { id: loan.customerId }
      });

      if (!customer || !customer.email) continue;

      const schedule = loan.schedule || [];
      const overdueSchedule = schedule.filter(s => s.status === 'Pending' && new Date(s.dueDate) < new Date());
      const overdueAmount = overdueSchedule.reduce((sum, s) => sum + s.emi, 0);

      if (overdueAmount > 0) {
        // Fetch logs and filter in JS to avoid complex MySQL JSON path filtering issues
        const recentLogs = await prisma.notificationlogs.findMany({
          where: {
            event: 'overdue_alert',
            status: 'Sent'
          },
          orderBy: { createdAt: 'desc' }
        });
        
        const lastLog = recentLogs.find(log => log.metadata && log.metadata.loanId === loan.id);

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
          console.log(`Sending overdue notice for ${loan.machineName} to ${customer.email}`);
          await sendNotification('overdue_alert', {
            name: customer.name,
            email: customer.email,
            machineName: loan.machineName,
            overdueAmount: overdueAmount.toLocaleString('en-IN'),
            currency: '₹',
            dueDate: overdueSchedule[0].dueDate
          }, { loanId: loan.id, auto: true });
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
