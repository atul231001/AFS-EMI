import express from 'express';
import prisma from '../config/prisma.js';
import nodemailer from 'nodemailer';
import { sendNotification } from '../services/notificationService.js';

const router = express.Router();
console.log('--- Notification Routes Initializing ---');

// --- Template Routes ---

// Get all templates
router.get('/templates', async (req, res) => {
  try {
    const templates = await prisma.notificationtemplates.findMany();
    res.json(templates.map(t => ({ ...t, _id: t.id })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create/Update template
router.post('/templates', async (req, res) => {
  try {
    const { event, name, subject, body, variables, enabled, channels } = req.body;
    let template = await prisma.notificationtemplates.findUnique({ where: { event } });
    if (template) {
      template = await prisma.notificationtemplates.update({
        where: { event },
        data: { name, subject, body, variables, enabled, channels, updatedAt: new Date() }
      });
    } else {
      const newId = [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
      template = await prisma.notificationtemplates.create({
        data: { event, name, subject, body, variables, enabled, channels, id: newId, createdAt: new Date(), updatedAt: new Date() }
      });
    }
    res.json({ ...template, _id: template.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete template
router.delete('/templates/:id', async (req, res) => {
  try {
    await prisma.notificationtemplates.delete({ where: { id: req.params.id } });
    res.json({ message: 'Template deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- Log Routes ---

// Get all logs
router.get('/logs', async (req, res) => {
  try {
    const logs = await prisma.notificationlogs.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json(logs.map(l => ({ ...l, _id: l.id })));
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
    const loan = await prisma.loans.findUnique({ where: { id: loanId }, include: { customers: true } });
    if (!loan) return res.status(404).json({ message: 'Loan/Asset not found' });

    const customer = loan.customers;
    if (!customer || !customer.email) return res.status(400).json({ message: 'Customer email not found' });

    let schedule = [];
    try { schedule = typeof loan.schedule === 'string' ? JSON.parse(loan.schedule) : loan.schedule; } catch(e){}

    const overdueSchedule = (schedule || []).filter(s => s.status === 'Pending' && new Date(s.dueDate) < new Date());
    const overdueAmount = overdueSchedule.reduce((sum, s) => sum + s.emi, 0);

    const upcomingSchedule = (schedule || []).filter(s => s.status === 'Pending' && new Date(s.dueDate) >= new Date()).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
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
