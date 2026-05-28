import User from '../models/User.js';
import Role from '../models/Role.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// Helper to ensure default Admin role with full permissions
const ensureAdminRole = async () => {
  const fullPermissions = {
    dashboard: { read: true },
    customers: { read: true, create: true, update: true, delete: true },
    machines: { read: true, create: true, update: true, delete: true },
    financing: { read: true, create: true, update: true, delete: true },
    new_financing: { read: true, create: true },
    financed_machines: { read: true, update: true },
    settlements: { read: true, create: true, update: true, delete: true },
    employees: { read: true, create: true, update: true, delete: true },
    settings_parent: { read: true },
    settings_general: { read: true, update: true },
    settings_rbac: { read: true, update: true },
    fmc: { read: true, create: true, update: true, delete: true },
    service_desk: { read: true, create: true, update: true, delete: true }
  };

  try {
    let adminRole = await Role.findOne({ name: 'Admin' });
    if (!adminRole) {
      adminRole = await Role.create({
        name: 'Admin',
        description: 'Master Administrator with unrestricted access',
        permissions: fullPermissions
      });
    } else {
      adminRole.permissions = fullPermissions;
      await adminRole.save();
    }
    return adminRole;
  } catch (error) {
    console.error("Critical: Failed to sync Admin role", error);
    return null;
  }
};

export const login = async (req, res) => {
  const { email, password, role } = req.body;
  console.log("Login request:", req.body);
  try {
    let queryRole = role;
    if (role === 'OEM') {
      queryRole = { $in: ['OEM', 'SUPERVISOR'] };
    }
    let user = await User.findOne({ email, role: queryRole }).populate('roleId').populate('customerId');

    // Master Admin Auto-Assignment
    if (user && email === 'oem@liugong.com' && password === user.password) {
      const adminRole = await ensureAdminRole();
      if (!user.roleId || user.roleId.name !== 'Admin') {
        user.roleId = adminRole._id;
        await user.save();
        user = await User.findById(user._id).populate('roleId');
      }
    }

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        roleId: user.roleId,
        customerId: user.customerId,
        supervisorId: user.supervisorId || null,
        type: user.type || user.customerId?.type,
        status: user.status,
        settings: user.settings,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email, password or role' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const register = async (req, res) => {
  const { name, email, password, role, customerId } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const user = await User.create({ name, email, password, role, customerId });
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
