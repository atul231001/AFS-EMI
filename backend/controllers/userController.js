import prisma from '../config/prisma.js';
import { sendNotification } from '../services/notificationService.js';

export const updateSettings = async (req, res) => {
  const { userId, settings } = req.body;
  try {
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    let currentSettings = {};
    if (user.settings) {
      try { currentSettings = typeof user.settings === 'string' ? JSON.parse(user.settings) : user.settings; } catch(e){}
    }
    
    const newSettings = { ...currentSettings, ...settings };
    await prisma.users.update({
      where: { id: userId },
      data: { settings: newSettings }
    });
    res.json(newSettings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSettings = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    let currentSettings = { fontFamily: 'Inter', fontSize: '14' };
    if (user.settings) {
      try { currentSettings = typeof user.settings === 'string' ? JSON.parse(user.settings) : user.settings; } catch(e){}
    }
    res.json(currentSettings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    // Find users and manually fetch roles if necessary. The schema has roleId which is a string.
    const users = await prisma.users.findMany({ where: filter, orderBy: { createdAt: 'desc' } });
    
    // Fetch roles and append them (simulating populate)
    const roleIds = users.map(u => u.roleId).filter(Boolean);
    const roles = await prisma.roles.findMany({ where: { id: { in: roleIds } } });
    const roleMap = {};
    roles.forEach(r => roleMap[r.id] = { ...r, _id: r.id });
    
    const mapped = users.map(u => {
      const uObj = { ...u, _id: u.id };
      if (u.roleId && roleMap[u.roleId]) {
        uObj.roleId = roleMap[u.roleId];
      }
      return uObj;
    });
    
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const payload = { ...req.body };
    const config = await prisma.systemconfigs.findFirst();

    // Individual Unique Checks
    if (payload.email) {
      const emailExists = await prisma.users.findFirst({ where: { email: payload.email } });
      if (emailExists) return res.status(400).json({ message: 'Security Breach: This Email is already associated with an authorized account.' });
    }
    if (payload.phone) {
      const phoneExists = await prisma.users.findFirst({ where: { phone: payload.phone } });
      if (phoneExists) return res.status(400).json({ message: 'Security Breach: This Mobile Number is already registered in the personnel directory.' });
    }
    if (payload.customId) {
      const idExists = await prisma.users.findFirst({ where: { customId: payload.customId } });
      if (idExists) return res.status(400).json({ message: 'Security Breach: This ID is already assigned to another staff member.' });
    }

    // Auto-ID Generation
    if (config?.numbering) {
      let type = '';
      if (payload.role === 'OEM') type = 'employee';
      if (payload.role === 'SUPERVISOR') type = 'supervisor';

      let numberingConfig = config.numbering;
      try {
        if (typeof numberingConfig === 'string') numberingConfig = JSON.parse(numberingConfig);
      } catch(e) {}

      if (type && numberingConfig && numberingConfig[type]?.mode === 'Auto' && !payload.customId) {
        const prefix = numberingConfig[type].prefix || '';
        const nextNumber = numberingConfig[type].nextNumber || 1;
        payload.customId = `${prefix}${nextNumber.toString().padStart(4, '0')}`;
        
        numberingConfig[type].nextNumber = nextNumber + 1;
        await prisma.systemconfigs.update({
          where: { id: config.id },
          data: { numbering: numberingConfig }
        });
      }
    }

    // Generate a secure random 10-character alphanumeric password if none provided
    if (!payload.password || payload.password.trim() === '') {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let randomPassword = '';
      for (let i = 0; i < 10; i++) {
        randomPassword += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      payload.password = randomPassword;
    }
    console.log(`[User Onboarding] Password for new user ${payload.email}: ${payload.password}`);

    payload.mustResetPassword = true;
    const newId = [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    payload.id = newId;
    payload.createdAt = new Date();
    payload.updatedAt = new Date();

    const user = await prisma.users.create({ data: payload });
    
    let roleObj = null;
    if (user.roleId) {
      roleObj = await prisma.roles.findUnique({ where: { id: user.roleId } });
      if (roleObj) roleObj._id = roleObj.id;
    }

    // Trigger Notification
    if (user.email && (user.role === 'OEM' || user.role === 'SUPERVISOR')) {
      sendNotification('employee_welcome', {
        email: user.email,
        name: user.name || '',
        username: user.email,
        password: payload.password, // Original password before hashing if applicable
        customId: user.customId || '',
        loginUrl: 'http://localhost:5173'
      }).catch(err => console.error('Delayed Notify Error:', err));
    }

    const populated = { ...user, _id: user.id };
    if (roleObj) populated.roleId = roleObj;

    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const updateData = { ...req.body, updatedAt: new Date() };
    const user = await prisma.users.update({
      where: { id: req.params.id },
      data: updateData
    });
    
    let roleObj = null;
    if (user.roleId) {
      roleObj = await prisma.roles.findUnique({ where: { id: user.roleId } });
      if (roleObj) roleObj._id = roleObj.id;
    }
    
    const populated = { ...user, _id: user.id };
    if (roleObj) populated.roleId = roleObj;

    res.json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    await prisma.users.delete({ where: { id: req.params.id } });
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
