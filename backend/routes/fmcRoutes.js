import express from 'express';
const router = express.Router();
import mongoose from 'mongoose';
import { FMCContract, FMCTicket, FMCSupervisor, FMCDailyHour, FMCInvoice } from '../models/FMC.js';
import User from '../models/User.js';
import TicketStatus from '../models/TicketStatus.js';
import ApprovalFlow from '../models/ApprovalFlow.js';
import Role from '../models/Role.js';

import { protect } from '../middleware/authMiddleware.js';
import { sendNotification } from '../services/notificationService.js';

// ── Helpers for Role-Based Approval Flow ─────────────────────────────────────
const isUserAdmin = async (user) => {
  if (!user) return false;
  if (user.email === 'oem@liugong.com') return true;
  if (user.roleId) {
    if (typeof user.roleId === 'object' && user.roleId.name) {
      const name = user.roleId.name.toUpperCase();
      return name.includes('ADMIN') || name.includes('SUPER');
    }
    const role = await Role.findById(user.roleId);
    if (role && role.name) {
      const name = role.name.toUpperCase();
      return name.includes('ADMIN') || name.includes('SUPER');
    }
  }
  return false;
};

const getTicketActiveApproverId = async (t) => {
  if (!t || t.status === 'Closed' || t.status === 'Resolved' || t.status === 'Rejected') {
    return null;
  }

  let supervisorId = t.supervisorId;
  if (!supervisorId && t.contractId) {
    const contract = await FMCContract.findById(t.contractId);
    if (contract && contract.assignedSupervisor) {
      const superv = await FMCSupervisor.findOne({
        $or: [
          { name: contract.assignedSupervisor },
          { _id: mongoose.isValidObjectId(contract.assignedSupervisor) ? contract.assignedSupervisor : new mongoose.Types.ObjectId() }
        ]
      });
      if (superv) {
        supervisorId = superv._id.toString();
      }
    }
  }

  let activeFlow = null;
  const flowQuery = { isActive: true, $or: [{ type: 'TICKET' }, { type: { $exists: false } }, { type: null }] };

  if (supervisorId) {
    const supervisor = await FMCSupervisor.findById(supervisorId);
    if (supervisor && supervisor.approvalFlowId) {
      activeFlow = await ApprovalFlow.findOne({ _id: supervisor.approvalFlowId, ...flowQuery });
    }
    if (!activeFlow) {
      activeFlow = await ApprovalFlow.findOne({ supervisorId: supervisorId, ...flowQuery });
    }
  }
  if (!activeFlow) {
    activeFlow = await ApprovalFlow.findOne({ $or: [{ supervisorId: '' }, { supervisorId: null }], ...flowQuery });
  }
  if (!activeFlow) return null;

  const stepIndex = t.currentStepIndex || 0;
  if (stepIndex >= activeFlow.steps.length) return null;
  const activeStep = activeFlow.steps[stepIndex];
  if (!activeStep) return null;

  return activeStep.approverId?.toString() || null;
};

// ── Helper: build CRUD for a model ─────────────────────────────────────────
const crud = (Model) => ({
  getAll: async (req, res) => {
    try { res.json(await Model.find().sort({ createdAt: -1 })); }
    catch (e) { res.status(500).json({ message: e.message }); }
  },
  create: async (req, res) => {
    try { const doc = await Model.create(req.body); res.status(201).json(doc); }
    catch (e) { res.status(400).json({ message: e.message }); }
  },
  update: async (req, res) => {
    try {
      const doc = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!doc) return res.status(404).json({ message: 'Not found' });
      res.json(doc);
    } catch (e) { res.status(400).json({ message: e.message }); }
  },
  delete: async (req, res) => {
    try {
      await Model.findByIdAndDelete(req.params.id);
      res.json({ success: true });
    } catch (e) { res.status(400).json({ message: e.message }); }
  }
});

// ── FMC Contracts ───────────────────────────────────────────────────────────
const contracts = crud(FMCContract);
router.get('/contracts', protect, contracts.getAll);
router.post('/contracts', protect, contracts.create);
router.put('/contracts/:id', protect, contracts.update);
router.delete('/contracts/:id', protect, contracts.delete);

// ── Ticket Statuses ─────────────────────────────────────────────────────────
router.get('/ticket-statuses', protect, async (req, res) => {
  try { res.json(await TicketStatus.find().populate('allowedUsers').sort({ name: 1 })); }
  catch (e) { res.status(500).json({ message: e.message }); }
});
router.post('/ticket-statuses', protect, async (req, res) => {
  try {
    const doc = await TicketStatus.create(req.body);
    res.status(201).json(await doc.populate('allowedUsers'));
  } catch (e) { res.status(400).json({ message: e.message }); }
});
router.put('/ticket-statuses/:id', protect, async (req, res) => {
  try {
    const doc = await TicketStatus.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('allowedUsers');
    res.json(doc);
  } catch (e) { res.status(400).json({ message: e.message }); }
});
router.delete('/ticket-statuses/:id', protect, async (req, res) => {
  try {
    await TicketStatus.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(400).json({ message: e.message }); }
});

// ── Approval Flows ──────────────────────────────────────────────────────────
router.get('/approval-flows', protect, async (req, res) => {
  try { res.json(await ApprovalFlow.find().populate('steps.approverId').populate('steps.statusId').sort({ createdAt: -1 })); }
  catch (e) { res.status(500).json({ message: e.message }); }
});
router.post('/approval-flows', protect, async (req, res) => {
  try {
    const supervisorId = req.body.supervisorId || '';
    const type = req.body.type || 'TICKET';
    const existing = await ApprovalFlow.findOne({ supervisorId, type });
    if (existing) {
      return res.status(400).json({ message: 'An approval flow already exists for this type and scope. You can only edit the existing flow.' });
    }
    const doc = await ApprovalFlow.create(req.body);
    res.status(201).json(await doc.populate(['steps.approverId', 'steps.statusId']));
  } catch (e) { res.status(400).json({ message: e.message }); }
});
router.put('/approval-flows/:id', protect, async (req, res) => {
  try {
    const supervisorId = req.body.supervisorId || '';
    const type = req.body.type || 'TICKET';
    const existing = await ApprovalFlow.findOne({ supervisorId, type, _id: { $ne: req.params.id } });
    if (existing) {
      return res.status(400).json({ message: 'An approval flow already exists for this type and scope. You can only edit the existing flow.' });
    }
    const doc = await ApprovalFlow.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('steps.approverId').populate('steps.statusId');
    res.json(doc);
  } catch (e) { res.status(400).json({ message: e.message }); }
});
router.delete('/approval-flows/:id', protect, async (req, res) => {
  try {
    await ApprovalFlow.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(400).json({ message: e.message }); }
});

// ── FMC Tickets ─────────────────────────────────────────────────────────────
router.get('/tickets', protect, async (req, res) => {
  try {
    const adminCheck = await isUserAdmin(req.user);
    let tickets;
    if (req.user.role === 'SUPERVISOR') {
      const supervId = req.user.supervisorId?.toString();
      tickets = await FMCTicket.find({
        $or: [
          { createdBy: req.user._id },
          { supervisorId: supervId }
        ]
      }).sort({ createdAt: -1 });
    } else if (adminCheck) {
      tickets = await FMCTicket.find().sort({ createdAt: -1 });
    } else {
      // Employee / Approver: see tickets where they are the active approver OR they are in the approval history
      const allTickets = await FMCTicket.find().sort({ createdAt: -1 });
      const visibleTickets = [];
      for (const t of allTickets) {
        const activeApproverId = await getTicketActiveApproverId(t);
        const hasApprovedBefore = t.approvalHistory?.some(h =>
          (h.approverId?._id || h.approverId)?.toString() === req.user._id.toString()
        );
        if (activeApproverId === req.user._id.toString() || hasApprovedBefore) {
          visibleTickets.push(t);
        }
      }
      tickets = visibleTickets;
    }
    res.json(tickets);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/tickets', protect, async (req, res) => {
  try {
    let supervisorId = null;
    if (req.user.role === 'SUPERVISOR') {
      supervisorId = req.user.supervisorId?.toString();
    } else if (req.body.contractId) {
      const contract = await FMCContract.findById(req.body.contractId);
      if (contract && contract.assignedSupervisor) {
        const superv = await FMCSupervisor.findOne({ name: contract.assignedSupervisor });
        if (superv) {
          supervisorId = superv._id.toString();
        }
      }
    }

    const payload = {
      ...req.body,
      status: 'Requested',
      currentStepIndex: 0,
      createdBy: req.user._id,
      supervisorId: supervisorId
    };

    const doc = await FMCTicket.create(payload);
    res.status(201).json(doc);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

router.put('/tickets/:id', protect, async (req, res) => {
  try {
    const ticket = await FMCTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    // Prevent edit of rejected tickets
    if (ticket.status === 'Rejected') {
      return res.status(400).json({ message: 'Rejected tickets cannot be updated.' });
    }

    const adminCheck = await isUserAdmin(req.user);
    if (adminCheck) {
      return res.status(403).json({ message: 'Access Denied: Admins are not allowed to edit tickets.' });
    }

    if (req.user.role !== 'SUPERVISOR') {
      return res.status(403).json({ message: 'Access Denied: Approvers are not allowed to edit tickets.' });
    }

    const isOwner = ticket.createdBy?.toString() === req.user._id.toString() ||
      ticket.supervisorId?.toString() === req.user.supervisorId?.toString();
    if (!isOwner) {
      return res.status(403).json({ message: 'Access Denied: Supervisors can only read and update their own tickets.' });
    }

    // Only editable before approval process starts
    if (ticket.currentStepIndex > 0 || ticket.status !== 'Requested') {
      return res.status(400).json({ message: 'Access Denied: Tickets cannot be edited after the approval process has started.' });
    }

    Object.assign(ticket, req.body);
    const updated = await ticket.save();
    res.json(updated);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

router.delete('/tickets/:id', protect, async (req, res) => {
  try {
    const ticket = await FMCTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    const adminCheck = await isUserAdmin(req.user);
    if (req.user.role === 'SUPERVISOR') {
      const isOwner = ticket.createdBy?.toString() === req.user._id.toString() ||
        ticket.supervisorId?.toString() === req.user.supervisorId?.toString();
      if (!isOwner) {
        return res.status(403).json({ message: 'Access Denied: Supervisors can only delete their own tickets.' });
      }
      if (ticket.currentStepIndex > 0 || ticket.status !== 'Requested') {
        return res.status(400).json({ message: 'Access Denied: Tickets cannot be deleted after the approval process has started.' });
      }
    } else if (!adminCheck) {
      return res.status(403).json({ message: 'Access Denied: Approvers are not allowed to delete tickets.' });
    }

    await FMCTicket.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(400).json({ message: e.message }); }
});

router.post('/tickets/:id/approve', protect, async (req, res) => {
  try {
    const ticket = await FMCTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    const adminCheck = await isUserAdmin(req.user);

    const { notes, action } = req.body;

    const activeApproverId = await getTicketActiveApproverId(ticket);
    if (!adminCheck && (!activeApproverId || activeApproverId !== req.user._id.toString())) {
      return res.status(403).json({ message: 'You are not the designated approver for this step.' });
    }

    let supervisorId = ticket.supervisorId;
    if (!supervisorId && ticket.contractId) {
      const contract = await FMCContract.findById(ticket.contractId);
      if (contract && contract.assignedSupervisor) {
        const superv = await FMCSupervisor.findOne({
          $or: [
            { name: contract.assignedSupervisor },
            { _id: mongoose.isValidObjectId(contract.assignedSupervisor) ? contract.assignedSupervisor : new mongoose.Types.ObjectId() }
          ]
        });
        if (superv) supervisorId = superv._id.toString();
      }
    }

    let flow = null;
    const flowQuery = { isActive: true, $or: [{ type: 'TICKET' }, { type: { $exists: false } }, { type: null }] };
    
    if (supervisorId) {
      const supervisor = await FMCSupervisor.findById(supervisorId);
      if (supervisor && supervisor.approvalFlowId) {
        flow = await ApprovalFlow.findOne({ _id: supervisor.approvalFlowId, ...flowQuery }).populate('steps.approverId').populate('steps.statusId');
      }
      if (!flow) {
        flow = await ApprovalFlow.findOne({ supervisorId, ...flowQuery }).populate('steps.approverId').populate('steps.statusId');
      }
    }
    if (!flow) {
      flow = await ApprovalFlow.findOne({ $or: [{ supervisorId: '' }, { supervisorId: null }], ...flowQuery }).populate('steps.approverId').populate('steps.statusId');
    }

    if (!flow) {
      return res.status(400).json({ message: 'No active approval flow configured.' });
    }

    if (ticket.currentStepIndex >= flow.steps.length) {
      return res.status(400).json({ message: 'Ticket has already completed all approval steps.' });
    }

    const currentStep = flow.steps[ticket.currentStepIndex];
    if (!currentStep) {
      return res.status(400).json({ message: 'Designated step does not exist.' });
    }

    if (action === 'Approved') {
      const isFinalStep = ticket.currentStepIndex + 1 >= flow.steps.length;
      const targetStatus = currentStep.statusId?.name || (isFinalStep ? 'Approved' : `Pending for Level ${ticket.currentStepIndex + 2} Approval`);

      ticket.status = targetStatus;
      ticket.currentStepIndex += 1;
      ticket.approvalHistory.push({
        approverId: req.user._id,
        approverName: req.user.name,
        status: targetStatus,
        action: 'Approved',
        notes: notes || 'Approved step'
      });
    } else {
      ticket.status = 'Rejected';
      ticket.approvalHistory.push({
        approverId: req.user._id,
        approverName: req.user.name,
        status: 'Rejected',
        action: 'Rejected',
        notes: notes || 'Rejected step'
      });
    }

    const updated = await ticket.save();
    res.json(updated);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// ── FMC Supervisors — with linked User account ─────────────────────────────
router.get('/supervisors', protect, async (req, res) => {
  try {
    const supervisors = await FMCSupervisor.find().sort({ createdAt: -1 }).lean();
    const supervisorIds = supervisors.map(s => s._id);
    const users = await User.find({ supervisorId: { $in: supervisorIds } }, 'email supervisorId');
    const emailMap = {};
    users.forEach(u => {
      if (u.supervisorId) {
        emailMap[u.supervisorId.toString()] = u.email;
      }
    });
    const result = supervisors.map(s => ({
      ...s,
      email: emailMap[s._id.toString()] || ''
    }));
    res.json(result);
  }
  catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/supervisors', protect, async (req, res) => {
  try {
    const { email, password, ...supervisorData } = req.body;

    if (supervisorData.approvalFlowId === '') {
      supervisorData.approvalFlowId = null;
    }

    // 1. Create the FMC supervisor profile
    const supervisor = await FMCSupervisor.create(supervisorData);

    // 2. If email provided, create a linked User account and generate random password if needed
    if (email) {
      const finalPassword = (password && password.trim() !== '') ? password : (() => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let randomPassword = '';
        for (let i = 0; i < 10; i++) {
          randomPassword += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return randomPassword;
      })();

      console.log(`[Supervisor Onboarding] Password for ${email}: ${finalPassword}`);

      const existing = await User.findOne({ email });
      if (existing) {
        // Update existing user to link to this supervisor
        existing.supervisorId = supervisor._id;
        existing.role = 'SUPERVISOR';
        existing.name = supervisor.name;
        existing.password = finalPassword;
        existing.mustResetPassword = true;
        await existing.save();
      } else {
        await User.create({
          name: supervisor.name,
          email,
          password: finalPassword,
          role: 'SUPERVISOR',
          supervisorId: supervisor._id,
          status: supervisor.status || 'Active',
          mustResetPassword: true
        });
      }

      // Send welcome notification
      sendNotification('employee_welcome', {
        email,
        name: supervisor.name,
        username: email,
        password: finalPassword,
        customId: supervisor.employeeId || '',
        loginUrl: 'http://localhost:5173'
      }).catch(err => console.error('FMC Supervisor welcome notification error:', err));
    }

    const supervisorObj = supervisor.toObject();
    supervisorObj.email = email || '';
    res.status(201).json(supervisorObj);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.put('/supervisors/:id', protect, async (req, res) => {
  try {
    const { email, password, ...supervisorData } = req.body;
    if (supervisorData.approvalFlowId === '') {
      supervisorData.approvalFlowId = null;
    }
    const supervisor = await FMCSupervisor.findByIdAndUpdate(req.params.id, supervisorData, { new: true });
    if (!supervisor) return res.status(404).json({ message: 'Supervisor not found' });

    // Update linked user if email provided
    if (email) {
      const existingUser = await User.findOne({ supervisorId: supervisor._id });
      if (existingUser) {
        existingUser.email = email;
        existingUser.name = supervisor.name;
        existingUser.status = supervisor.status || 'Active';
        if (password) existingUser.password = password;
        await existingUser.save();
      } else {
        // Create new user if not exists
        const finalPassword = (password && password.trim() !== '') ? password : (() => {
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
          let randomPassword = '';
          for (let i = 0; i < 10; i++) {
            randomPassword += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          return randomPassword;
        })();

        await User.create({
          name: supervisor.name,
          email,
          password: finalPassword,
          role: 'SUPERVISOR',
          supervisorId: supervisor._id,
          status: supervisor.status || 'Active',
          mustResetPassword: true
        });

        // Send welcome notification
        sendNotification('employee_welcome', {
          email,
          name: supervisor.name,
          username: email,
          password: finalPassword,
          customId: supervisor.employeeId || '',
          loginUrl: 'http://localhost:5173'
        }).catch(err => console.error('FMC Supervisor welcome notification error:', err));
      }
    }

    const supervisorObj = supervisor.toObject();
    const linkedUser = await User.findOne({ supervisorId: supervisor._id }, 'email');
    supervisorObj.email = linkedUser ? linkedUser.email : (email || '');
    res.json(supervisorObj);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.delete('/supervisors/:id', protect, async (req, res) => {
  try {
    // Also remove the linked user account
    await User.deleteOne({ supervisorId: req.params.id });
    await FMCSupervisor.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// ── FMC Daily Hours ─────────────────────────────────────────────────────────
const hours = crud(FMCDailyHour);
router.get('/daily-hours', protect, hours.getAll);
router.post('/daily-hours', protect, hours.create);
router.put('/daily-hours/:id', protect, hours.update);
router.delete('/daily-hours/:id', protect, hours.delete);

// ── FMC Invoices ────────────────────────────────────────────────────────────
const invoices = crud(FMCInvoice);
router.get('/invoices', protect, invoices.getAll);
router.post('/invoices', protect, invoices.create);
router.put('/invoices/:id', protect, invoices.update);
router.delete('/invoices/:id', protect, invoices.delete);

export default router;
