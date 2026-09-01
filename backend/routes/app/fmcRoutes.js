import express from 'express';
const router = express.Router();
import prisma from '../../config/prisma.js';
import { protect } from '../../middleware/authMiddleware.js';
import { sendNotification } from '../../services/notificationService.js';

// ── Helpers for Role-Based Approval Flow ─────────────────────────────────────
const isUserAdmin = async (user) => {
  if (!user) return false;
  if (user.email === 'oem@liugong.com') return true;
  if (user.roleId) {
    if (typeof user.roleId === 'object' && user.roleId.name) {
      const name = user.roleId.name.toUpperCase();
      return name.includes('ADMIN') || name.includes('SUPER');
    }
    const role = await prisma.roles.findUnique({ where: { id: user.roleId } });
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
    const contract = await prisma.fmccontracts.findUnique({ where: { id: t.contractId } });
    if (contract && contract.assignedSupervisor) {
      const superv = await prisma.fmcsupervisors.findFirst({
        where: {
          OR: [
            { name: contract.assignedSupervisor },
            { id: contract.assignedSupervisor }
          ]
        }
      });
      if (superv) {
        supervisorId = superv.id;
      }
    }
  }

  let activeFlow = null;
  
  if (supervisorId) {
    const supervisor = await prisma.fmcsupervisors.findUnique({ where: { id: supervisorId } });
    if (supervisor && supervisor.approvalFlowId) {
      activeFlow = await prisma.approvalflows.findFirst({
        where: {
          id: supervisor.approvalFlowId,
          isActive: true,
          OR: [{ type: 'TICKET' }, { type: null }]
        }
      });
    }
    if (!activeFlow) {
      activeFlow = await prisma.approvalflows.findFirst({
        where: {
          supervisorId: supervisorId,
          isActive: true,
          OR: [{ type: 'TICKET' }, { type: null }]
        }
      });
    }
  }
  
  if (!activeFlow) {
    activeFlow = await prisma.approvalflows.findFirst({
      where: {
        OR: [{ supervisorId: '' }, { supervisorId: null }],
        isActive: true,
        AND: [{ OR: [{ type: 'TICKET' }, { type: null }] }]
      }
    });
  }
  if (!activeFlow) return null;

  const stepIndex = t.currentStepIndex || 0;
  
  let steps = [];
  try { steps = typeof activeFlow.steps === 'string' ? JSON.parse(activeFlow.steps) : (activeFlow.steps || []); } catch(e){}

  if (stepIndex >= steps.length) return null;
  const activeStep = steps[stepIndex];
  if (!activeStep) return null;

  return activeStep.approverId || null;
};

// ── Helper: build CRUD for a model ─────────────────────────────────────────
const crud = (modelName) => ({
  getAll: async (req, res) => {
    try {
      const data = await prisma[modelName].findMany({ orderBy: { createdAt: 'desc' } });
      res.json(data.map(d => ({ ...d, _id: d.id })));
    }
    catch (e) { res.status(500).json({ message: e.message }); }
  },
  create: async (req, res) => {
    try {
      const newId = [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
      const doc = await prisma[modelName].create({ data: { ...req.body, id: newId, createdAt: new Date(), updatedAt: new Date() } });
      res.status(201).json({ ...doc, _id: doc.id });
    }
    catch (e) { res.status(400).json({ message: e.message }); }
  },
  update: async (req, res) => {
    try {
      const doc = await prisma[modelName].update({
        where: { id: req.params.id },
        data: { ...req.body, updatedAt: new Date() }
      });
      res.json({ ...doc, _id: doc.id });
    } catch (e) { res.status(400).json({ message: e.message }); }
  },
  delete: async (req, res) => {
    try {
      await prisma[modelName].delete({ where: { id: req.params.id } });
      res.json({ success: true });
    } catch (e) { res.status(400).json({ message: e.message }); }
  }
});

// ── FMC Contracts ───────────────────────────────────────────────────────────
const contracts = crud('fmccontracts');
router.get('/contracts', protect, contracts.getAll);
router.post('/contracts', protect, contracts.create);
router.put('/contracts/:id', protect, contracts.update);
router.delete('/contracts/:id', protect, contracts.delete);

// ── Ticket Statuses ─────────────────────────────────────────────────────────
router.get('/ticket-statuses', protect, async (req, res) => {
  try {
    const statuses = await prisma.ticketstatuses.findMany({ orderBy: { name: 'asc' } });
    res.json(statuses.map(s => ({ ...s, _id: s.id })));
  }
  catch (e) { res.status(500).json({ message: e.message }); }
});
router.post('/ticket-statuses', protect, async (req, res) => {
  try {
    const newId = [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    const doc = await prisma.ticketstatuses.create({ data: { ...req.body, id: newId, createdAt: new Date(), updatedAt: new Date() } });
    res.status(201).json({ ...doc, _id: doc.id });
  } catch (e) { res.status(400).json({ message: e.message }); }
});
router.put('/ticket-statuses/:id', protect, async (req, res) => {
  try {
    const doc = await prisma.ticketstatuses.update({
      where: { id: req.params.id },
      data: { ...req.body, updatedAt: new Date() }
    });
    res.json({ ...doc, _id: doc.id });
  } catch (e) { res.status(400).json({ message: e.message }); }
});
router.delete('/ticket-statuses/:id', protect, async (req, res) => {
  try {
    await prisma.ticketstatuses.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) { res.status(400).json({ message: e.message }); }
});

// ── Approval Flows ──────────────────────────────────────────────────────────
router.get('/approval-flows', protect, async (req, res) => {
  try {
    const flows = await prisma.approvalflows.findMany({ orderBy: { createdAt: 'desc' } });
    // Mock populate steps
    const flowList = [];
    for (let f of flows) {
      const flowObj = { ...f, _id: f.id };
      let steps = [];
      try { steps = typeof f.steps === 'string' ? JSON.parse(f.steps) : (f.steps || []); } catch(e){}
      
      const populatedSteps = [];
      for (let s of steps) {
        let approverObj = s.approverId;
        let statusObj = s.statusId;
        if (s.approverId) {
          const user = await prisma.users.findUnique({ where: { id: s.approverId } });
          if (user) approverObj = { ...user, _id: user.id };
        }
        if (s.statusId) {
          const status = await prisma.ticketstatuses.findUnique({ where: { id: s.statusId } });
          if (status) statusObj = { ...status, _id: status.id };
        }
        populatedSteps.push({ ...s, approverId: approverObj, statusId: statusObj });
      }
      flowObj.steps = populatedSteps;
      flowList.push(flowObj);
    }
    res.json(flowList);
  }
  catch (e) { res.status(500).json({ message: e.message }); }
});
router.post('/approval-flows', protect, async (req, res) => {
  try {
    const supervisorId = req.body.supervisorId || '';
    const type = req.body.type || 'TICKET';
    const existing = await prisma.approvalflows.findFirst({ where: { supervisorId, type } });
    if (existing) {
      return res.status(400).json({ message: 'An approval flow already exists for this type and scope. You can only edit the existing flow.' });
    }
    const newId = [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    const doc = await prisma.approvalflows.create({ data: { ...req.body, id: newId, createdAt: new Date(), updatedAt: new Date() } });
    res.status(201).json({ ...doc, _id: doc.id });
  } catch (e) { res.status(400).json({ message: e.message }); }
});
router.put('/approval-flows/:id', protect, async (req, res) => {
  try {
    const supervisorId = req.body.supervisorId || '';
    const type = req.body.type || 'TICKET';
    const existing = await prisma.approvalflows.findFirst({ where: { supervisorId, type, id: { not: req.params.id } } });
    if (existing) {
      return res.status(400).json({ message: 'An approval flow already exists for this type and scope. You can only edit the existing flow.' });
    }
    const doc = await prisma.approvalflows.update({
      where: { id: req.params.id },
      data: { ...req.body, updatedAt: new Date() }
    });
    res.json({ ...doc, _id: doc.id });
  } catch (e) { res.status(400).json({ message: e.message }); }
});
router.delete('/approval-flows/:id', protect, async (req, res) => {
  try {
    await prisma.approvalflows.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) { res.status(400).json({ message: e.message }); }
});

// ── FMC Tickets ─────────────────────────────────────────────────────────────
router.get('/tickets', protect, async (req, res) => {
  try {
    const adminCheck = await isUserAdmin(req.user);
    let tickets = [];
    if (req.user.role === 'SUPERVISOR') {
      const supervId = req.user.supervisorId;
      tickets = await prisma.fmctickets.findMany({
        where: {
          OR: [
            { createdBy: req.user.id },
            { supervisorId: supervId }
          ]
        },
        orderBy: { createdAt: 'desc' }
      });
    } else if (adminCheck) {
      tickets = await prisma.fmctickets.findMany({ orderBy: { createdAt: 'desc' } });
    } else {
      // Employee / Approver: see tickets where they are the active approver OR they are in the approval history
      const allTickets = await prisma.fmctickets.findMany({ orderBy: { createdAt: 'desc' } });
      const visibleTickets = [];
      for (const t of allTickets) {
        const activeApproverId = await getTicketActiveApproverId(t);
        
        let approvalHistory = [];
        try { approvalHistory = typeof t.approvalHistory === 'string' ? JSON.parse(t.approvalHistory) : (t.approvalHistory || []); } catch(e){}
        
        const hasApprovedBefore = approvalHistory?.some(h =>
          (h.approverId?.id || h.approverId) === req.user.id
        );
        if (activeApproverId === req.user.id || hasApprovedBefore) {
          visibleTickets.push(t);
        }
      }
      tickets = visibleTickets;
    }
    res.json(tickets.map(t => ({ ...t, _id: t.id })));
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/tickets', protect, async (req, res) => {
  try {
    let supervisorId = null;
    if (req.user.role === 'SUPERVISOR') {
      supervisorId = req.user.supervisorId;
    } else if (req.body.contractId) {
      const contract = await prisma.fmccontracts.findUnique({ where: { id: req.body.contractId } });
      if (contract && contract.assignedSupervisor) {
        const superv = await prisma.fmcsupervisors.findFirst({ where: { name: contract.assignedSupervisor } });
        if (superv) {
          supervisorId = superv.id;
        }
      }
    }

    const newId = [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    const payload = {
      ...req.body,
      id: newId,
      status: 'Requested',
      currentStepIndex: 0,
      createdBy: req.user.id,
      supervisorId: supervisorId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const doc = await prisma.fmctickets.create({ data: payload });
    res.status(201).json({ ...doc, _id: doc.id });
  } catch (e) { res.status(400).json({ message: e.message }); }
});

router.put('/tickets/:id', protect, async (req, res) => {
  try {
    const ticket = await prisma.fmctickets.findUnique({ where: { id: req.params.id } });
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

    const isOwner = ticket.createdBy === req.user.id || ticket.supervisorId === req.user.supervisorId;
    if (!isOwner) {
      return res.status(403).json({ message: 'Access Denied: Supervisors can only read and update their own tickets.' });
    }

    // Only editable before approval process starts
    if (ticket.currentStepIndex > 0 || ticket.status !== 'Requested') {
      return res.status(400).json({ message: 'Access Denied: Tickets cannot be edited after the approval process has started.' });
    }

    const updated = await prisma.fmctickets.update({
      where: { id: req.params.id },
      data: { ...req.body, updatedAt: new Date() }
    });
    res.json({ ...updated, _id: updated.id });
  } catch (e) { res.status(400).json({ message: e.message }); }
});

router.delete('/tickets/:id', protect, async (req, res) => {
  try {
    const ticket = await prisma.fmctickets.findUnique({ where: { id: req.params.id } });
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    const adminCheck = await isUserAdmin(req.user);
    if (req.user.role === 'SUPERVISOR') {
      const isOwner = ticket.createdBy === req.user.id || ticket.supervisorId === req.user.supervisorId;
      if (!isOwner) {
        return res.status(403).json({ message: 'Access Denied: Supervisors can only delete their own tickets.' });
      }
      if (ticket.currentStepIndex > 0 || ticket.status !== 'Requested') {
        return res.status(400).json({ message: 'Access Denied: Tickets cannot be deleted after the approval process has started.' });
      }
    } else if (!adminCheck) {
      return res.status(403).json({ message: 'Access Denied: Approvers are not allowed to delete tickets.' });
    }

    await prisma.fmctickets.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) { res.status(400).json({ message: e.message }); }
});

router.post('/tickets/:id/approve', protect, async (req, res) => {
  try {
    const ticket = await prisma.fmctickets.findUnique({ where: { id: req.params.id } });
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    const adminCheck = await isUserAdmin(req.user);

    const { notes, action } = req.body;

    const activeApproverId = await getTicketActiveApproverId(ticket);
    if (!adminCheck && (!activeApproverId || activeApproverId !== req.user.id)) {
      return res.status(403).json({ message: 'You are not the designated approver for this step.' });
    }

    let supervisorId = ticket.supervisorId;
    if (!supervisorId && ticket.contractId) {
      const contract = await prisma.fmccontracts.findUnique({ where: { id: ticket.contractId } });
      if (contract && contract.assignedSupervisor) {
        const superv = await prisma.fmcsupervisors.findFirst({
          where: {
            OR: [
              { name: contract.assignedSupervisor },
              { id: contract.assignedSupervisor }
            ]
          }
        });
        if (superv) supervisorId = superv.id;
      }
    }

    let flow = null;
    if (supervisorId) {
      const supervisor = await prisma.fmcsupervisors.findUnique({ where: { id: supervisorId } });
      if (supervisor && supervisor.approvalFlowId) {
        flow = await prisma.approvalflows.findFirst({
          where: { id: supervisor.approvalFlowId, isActive: true, OR: [{ type: 'TICKET' }, { type: null }] }
        });
      }
      if (!flow) {
        flow = await prisma.approvalflows.findFirst({
          where: { supervisorId, isActive: true, OR: [{ type: 'TICKET' }, { type: null }] }
        });
      }
    }
    if (!flow) {
      flow = await prisma.approvalflows.findFirst({
        where: { OR: [{ supervisorId: '' }, { supervisorId: null }], isActive: true, AND: [{ OR: [{ type: 'TICKET' }, { type: null }] }] }
      });
    }

    if (!flow) {
      return res.status(400).json({ message: 'No active approval flow configured.' });
    }
    
    let flowSteps = [];
    try { flowSteps = typeof flow.steps === 'string' ? JSON.parse(flow.steps) : (flow.steps || []); } catch(e){}

    if (ticket.currentStepIndex >= flowSteps.length) {
      return res.status(400).json({ message: 'Ticket has already completed all approval steps.' });
    }

    const currentStep = flowSteps[ticket.currentStepIndex];
    if (!currentStep) {
      return res.status(400).json({ message: 'Designated step does not exist.' });
    }
    
    let approvalHistory = [];
    try { approvalHistory = typeof ticket.approvalHistory === 'string' ? JSON.parse(ticket.approvalHistory) : (ticket.approvalHistory || []); } catch(e){}

    let updateData = {};

    if (action === 'Approved') {
      const isFinalStep = ticket.currentStepIndex + 1 >= flowSteps.length;
      
      let statusName = 'Approved';
      if (currentStep.statusId) {
        const stat = await prisma.ticketstatuses.findUnique({ where: { id: currentStep.statusId } });
        if (stat) statusName = stat.name;
      }
      
      const targetStatus = statusName || (isFinalStep ? 'Approved' : `Pending for Level ${ticket.currentStepIndex + 2} Approval`);

      updateData.status = targetStatus;
      updateData.currentStepIndex = ticket.currentStepIndex + 1;
      
      approvalHistory.push({
        approverId: req.user.id,
        approverName: req.user.name,
        status: targetStatus,
        action: 'Approved',
        notes: notes || 'Approved step',
        date: new Date()
      });
    } else {
      updateData.status = 'Rejected';
      approvalHistory.push({
        approverId: req.user.id,
        approverName: req.user.name,
        status: 'Rejected',
        action: 'Rejected',
        notes: notes || 'Rejected step',
        date: new Date()
      });
    }
    
    updateData.approvalHistory = approvalHistory;
    updateData.updatedAt = new Date();

    const updated = await prisma.fmctickets.update({
      where: { id: ticket.id },
      data: updateData
    });
    res.json({ ...updated, _id: updated.id });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// ── FMC Supervisors — with linked User account ─────────────────────────────
router.get('/supervisors', protect, async (req, res) => {
  try {
    const supervisors = await prisma.fmcsupervisors.findMany({ orderBy: { createdAt: 'desc' } });
    const supervisorIds = supervisors.map(s => s.id);
    const users = await prisma.users.findMany({
      where: { supervisorId: { in: supervisorIds } },
      select: { email: true, supervisorId: true }
    });
    const emailMap = {};
    users.forEach(u => {
      if (u.supervisorId) {
        emailMap[u.supervisorId] = u.email;
      }
    });
    const result = supervisors.map(s => ({
      ...s,
      _id: s.id,
      email: emailMap[s.id] || ''
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
    const newId = [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    const supervisor = await prisma.fmcsupervisors.create({
      data: { ...supervisorData, id: newId, createdAt: new Date(), updatedAt: new Date() }
    });

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

      const existing = await prisma.users.findFirst({ where: { email } });
      if (existing) {
        // Update existing user to link to this supervisor
        await prisma.users.update({
          where: { id: existing.id },
          data: {
            supervisorId: supervisor.id,
            role: 'SUPERVISOR',
            name: supervisor.name,
            password: finalPassword,
            mustResetPassword: true
          }
        });
      } else {
        const newUserId = [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
        await prisma.users.create({
          data: {
            id: newUserId,
            name: supervisor.name,
            email,
            password: finalPassword,
            role: 'SUPERVISOR',
            supervisorId: supervisor.id,
            status: supervisor.status || 'Active',
            mustResetPassword: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
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

    res.status(201).json({ ...supervisor, _id: supervisor.id, email: email || '' });
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
    const supervisor = await prisma.fmcsupervisors.update({
      where: { id: req.params.id },
      data: { ...supervisorData, updatedAt: new Date() }
    });

    // Update linked user if email provided
    if (email) {
      const existingUser = await prisma.users.findFirst({ where: { supervisorId: supervisor.id } });
      if (existingUser) {
        const userData = {
          email,
          name: supervisor.name,
          status: supervisor.status || 'Active'
        };
        if (password) userData.password = password;
        await prisma.users.update({ where: { id: existingUser.id }, data: userData });
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

        const newUserId = [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
        await prisma.users.create({
          data: {
            id: newUserId,
            name: supervisor.name,
            email,
            password: finalPassword,
            role: 'SUPERVISOR',
            supervisorId: supervisor.id,
            status: supervisor.status || 'Active',
            mustResetPassword: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
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

    const linkedUser = await prisma.users.findFirst({ where: { supervisorId: supervisor.id }, select: { email: true } });
    res.json({ ...supervisor, _id: supervisor.id, email: linkedUser ? linkedUser.email : (email || '') });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.delete('/supervisors/:id', protect, async (req, res) => {
  try {
    // Also remove the linked user account
    await prisma.users.deleteMany({ where: { supervisorId: req.params.id } });
    await prisma.fmcsupervisors.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// ── FMC Daily Hours ─────────────────────────────────────────────────────────
const hours = crud('fmcdailyhours');
router.get('/daily-hours', protect, hours.getAll);
router.post('/daily-hours', protect, hours.create);
router.put('/daily-hours/:id', protect, hours.update);
router.delete('/daily-hours/:id', protect, hours.delete);

// ── FMC Invoices ────────────────────────────────────────────────────────────
const invoices = crud('fmcinvoices');
router.get('/invoices', protect, invoices.getAll);
router.post('/invoices', protect, invoices.create);
router.put('/invoices/:id', protect, invoices.update);
router.delete('/invoices/:id', protect, invoices.delete);

export default router;
