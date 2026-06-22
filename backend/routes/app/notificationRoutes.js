import express from 'express';
import NotificationTemplate from '../../models/NotificationTemplate.js';
import NotificationLog from '../../models/NotificationLog.js';
import nodemailer from 'nodemailer';
import Loan from '../../models/Loan.js';
import Customer from '../../models/Customer.js';
import { sendNotification } from '../../services/notificationService.js';

const router = express.Router();
console.log('--- Notification Routes Initializing ---');

// --- Template Routes ---

// Get all templates
router.get('/templates', async (req, res) => {
  try {
    const templates = await NotificationTemplate.find();
    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create/Update template
router.post('/templates', async (req, res) => {
  try {
    const { event, name, subject, body, variables, enabled, channels } = req.body;
    const template = await NotificationTemplate.findOneAndUpdate(
      { event },
      { name, subject, body, variables, enabled, channels },
      { new: true, upsert: true }
    );
    res.json(template);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete template
router.delete('/templates/:id', async (req, res) => {
  try {
    await NotificationTemplate.findByIdAndDelete(req.params.id);
    res.json({ message: 'Template deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- Log Routes ---

// Get all logs
router.get('/logs', async (req, res) => {
  try {
    const logs = await NotificationLog.find().sort({ createdAt: -1 }).limit(100);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Test SMTP Connection
router.post('/test-mail', async (req, res) => {
  console.log('--- TEST MAIL ROUTE HIT ---');
  try {
    const { host, port, user, pass } = req.body;
    if (!host || !port || !user || !pass) {
      return res.status(400).json({ message: 'All SMTP fields are required for testing' });
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });

    await transporter.verify();
    res.json({ success: true, message: 'SMTP Server is reachable and credentials are valid' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Send Manual Overdue Notice
router.post('/send-overdue-notice', async (req, res) => {
  try {
    const { loanId } = req.body;
    const loan = await Loan.findById(loanId).populate('customerId');
    if (!loan) return res.status(404).json({ message: 'Loan/Asset not found' });

    const customer = loan.customerId;
    if (!customer || !customer.email) return res.status(400).json({ message: 'Customer email not found' });

    const overdueSchedule = (loan.schedule || []).filter(s => s.status === 'Pending' && new Date(s.dueDate) < new Date());
    const overdueAmount = overdueSchedule.reduce((sum, s) => sum + s.emi, 0);

    const upcomingSchedule = (loan.schedule || []).filter(s => s.status === 'Pending' && new Date(s.dueDate) >= new Date()).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    const upcomingEmi = upcomingSchedule[0];

    const isOverdue = overdueAmount > 0;
    const event = isOverdue ? 'overdue_alert' : 'emi_reminder';
    
    const amountToDisplay = isOverdue ? overdueAmount : (upcomingEmi?.emi || 0);
    const dateToDisplay = isOverdue ? overdueSchedule[0].dueDate : (upcomingEmi?.dueDate || 'N/A');

    const result = await sendNotification(event, {
      name: customer.name,
      email: customer.email,
      machineName: loan.machineName,
      overdueAmount: amountToDisplay.toLocaleString('en-IN'),
      amount: amountToDisplay.toLocaleString('en-IN'),
      currency: '₹',
      dueDate: dateToDisplay
    }, { loanId });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
