import User from '../models/User.js';
import SystemConfig from '../models/SystemConfig.js';
import { sendNotification } from '../services/notificationService.js';

export const updateSettings = async (req, res) => {
  const { userId, settings } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.settings = { ...user.settings, ...settings };
    await user.save();
    res.json(user.settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSettings = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.settings || { fontFamily: 'Inter', fontSize: '14' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter).populate('roleId');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const payload = { ...req.body };
    const config = await SystemConfig.findOne();

    // Individual Unique Checks
    if (payload.email) {
      const emailExists = await User.findOne({ email: payload.email });
      if (emailExists) return res.status(400).json({ message: 'Security Breach: This Email is already associated with an authorized account.' });
    }
    if (payload.phone) {
      const phoneExists = await User.findOne({ phone: payload.phone });
      if (phoneExists) return res.status(400).json({ message: 'Security Breach: This Mobile Number is already registered in the personnel directory.' });
    }
    if (payload.customId) {
      const idExists = await User.findOne({ customId: payload.customId });
      if (idExists) return res.status(400).json({ message: 'Security Breach: This ID is already assigned to another staff member.' });
    }

    // Auto-ID Generation
    if (config?.numbering) {
      let type = '';
      if (payload.role === 'OEM') type = 'employee';
      if (payload.role === 'SUPERVISOR') type = 'supervisor';

      if (type && config.numbering[type]?.mode === 'Auto' && !payload.customId) {
        const { prefix, nextNumber } = config.numbering[type];
        payload.customId = `${prefix}${nextNumber.toString().padStart(4, '0')}`;
        config.numbering[type].nextNumber += 1;
        await config.save();
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
    const user = await User.create(payload);
    const populated = await User.findById(user._id).populate('roleId');

    // Trigger Notification
    if (user.email && (user.role === 'OEM' || user.role === 'SUPERVISOR')) {
      sendNotification('employee_welcome', {
        email: user.email,
        name: user.name,
        username: user.email,
        password: payload.password, // Original password before hashing if applicable
        customId: user.customId,
        loginUrl: 'http://localhost:5173'
      }).catch(err => console.error('Delayed Notify Error:', err));
    }

    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('roleId');
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
