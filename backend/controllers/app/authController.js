import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const prisma = new PrismaClient();

const generateToken = (id) => {
  return jwt.sign({ id, source: 'app' }, process.env.JWT_SECRET_APP || process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const generateObjectId = () => crypto.randomBytes(12).toString('hex');

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
    let adminRole = await prisma.roles.findFirst({ where: { name: 'Admin' } });
    if (!adminRole) {
      adminRole = await prisma.roles.create({
        data: {
          id: generateObjectId(),
          name: 'Admin',
          description: 'Master Administrator with unrestricted access',
          permissions: fullPermissions,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    } else {
      adminRole = await prisma.roles.update({
        where: { id: adminRole.id },
        data: {
          permissions: fullPermissions,
          updatedAt: new Date()
        }
      });
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
      queryRole = { in: ['OEM', 'SUPERVISOR'] };
    }
    
    let user = await prisma.users.findFirst({ where: { email, role: queryRole } });
    
    if (user) {
      if (user.roleId) {
        user.roleId = await prisma.roles.findUnique({ where: { id: user.roleId } });
      }
      if (user.customerId) {
        user.customerId = await prisma.customers.findUnique({ where: { id: user.customerId } });
      }
    }

    // Master Admin Auto-Assignment
    if (user && email === 'oem@liugong.com' && password === user.password) {
      const adminRole = await ensureAdminRole();
      if (!user.roleId || user.roleId.name !== 'Admin') {
        user = await prisma.users.update({
          where: { id: user.id },
          data: { roleId: adminRole.id, updatedAt: new Date() }
        });
        user.roleId = adminRole;
      }
    }

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        success: true,
        statusCode: 200,
        message: "Data retrieved successfully",
        data: {
          _id: user.id,
          name: user.name,
          role: user.role,
          email: user.email
        },
        token: generateToken(user.id)
      });
    } else {
      res.status(401).json({
        success: false,
        statusCode: 401,
        message: "Invalid email, password or role"
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const register = async (req, res) => {
  const { name, email, password, role, customerId } = req.body;
  try {
    const userExists = await prisma.users.findFirst({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.users.create({
      data: {
        id: generateObjectId(),
        name,
        email,
        password: hashedPassword,
        role,
        customerId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user.id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await prisma.users.findFirst({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User with this identity not found' });
    }

    // Generate 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Set expiry to 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    await prisma.users.update({
      where: { id: user.id },
      data: {
        resetOtp: otp,
        resetOtpExpires: expiresAt,
        updatedAt: new Date()
      }
    });

    // Check system SMTP configuration
    const config = await prisma.systemconfigs.findFirst();
    const smtp = config?.smtp;

    if (smtp && smtp.host && smtp.user && smtp.pass) {
      const transporter = nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.secure,
        auth: {
          user: smtp.user,
          pass: smtp.pass,
        },
      });

      const mailOptions = {
        from: smtp.from || 'no-reply@liugong.com',
        to: email,
        subject: 'LiuGong Account Recovery - One-Time Password (OTP)',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; color: #333; max-width: 500px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #f0883e; text-align: center;">LiuGong Account Recovery</h2>
            <p>You requested a password reset. Use the following One-Time Password (OTP) to recover your account. This OTP is valid for 10 minutes:</p>
            <div style="font-size: 24px; font-weight: bold; text-align: center; padding: 15px; background-color: #eee; border-radius: 4px; letter-spacing: 5px; color: #f0883e; margin: 20px 0;">
              ${otp}
            </div>
            <p style="font-size: 12px; color: #777;">If you did not request this, please ignore this email.</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`[Email Sent] OTP email sent successfully to ${email}`);
    } else {
      console.log(`[SMTP Not Configured] OTP for ${email} is: ${otp}`);
    }

    res.json({ message: 'One-Time Password (OTP) has been sent to your registered email' });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: 'Internal server error during password recovery', error: error.message });
  }
};

export const resetPassword = async (req, res) => {
  const { email, otp, password } = req.body;
  try {
    const user = await prisma.users.findFirst({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.resetOtp || user.resetOtp !== otp || new Date(user.resetOtpExpires).getTime() < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP code' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    await prisma.users.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetOtp: null,
        resetOtpExpires: null,
        updatedAt: new Date()
      }
    });

    res.json({ message: 'Password recovery successful. Please log in with your new cipher.' });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: 'Internal server error during password reset', error: error.message });
  }
};

export const forceResetPassword = async (req, res) => {
  const { password } = req.body;
  try {
    const user = await prisma.users.findUnique({ where: { id: req.user._id || req.user.id } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    await prisma.users.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        mustResetPassword: false,
        updatedAt: new Date()
      }
    });

    res.json({ message: 'Cipher successfully initialized. Welcome to the portal.' });
  } catch (error) {
    console.error("Force reset password error:", error);
    res.status(500).json({ message: 'Failed to initialize password credentials', error: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const isBlacklisted = await prisma.blacklistedtokens.findFirst({ where: { token } });
      if (isBlacklisted) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'Already logged out' });
      }
      await prisma.blacklistedtokens.create({
        data: {
          id: generateObjectId(),
          token,
          createdAt: new Date()
        }
      });
    }

    res.json({ success: true, statusCode: 200, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, statusCode: 500, message: 'Logout failed', error: error.message });
  }
};
