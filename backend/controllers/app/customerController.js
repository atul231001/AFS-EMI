import prisma from '../../config/prisma.js';
import { sendNotification } from '../../services/notificationService.js';

export const getCustomers = async (req, res) => {
  try {
    let filter = {};
    if (req.user && req.user.role && req.user.role.toUpperCase() === 'CUSTOMER') {
      filter.id = req.user.customerId || undefined;
    }
    const customers = await prisma.customers.findMany({
      where: filter,
      orderBy: { createdAt: 'desc' }
    });
    
    const mapped = customers.map(c => ({ ...c, _id: c.id }));
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createCustomer = async (req, res) => {
  try {
    const payload = { ...req.body };
    const config = await prisma.systemconfigs.findFirst();

    // Auto-ID Generation
    if (config?.numbering?.customer?.mode === 'Auto' && !payload.customId) {
      const prefix = config.numbering.customer.prefix || '';
      const nextNumber = config.numbering.customer.nextNumber || 1;
      payload.customId = `${prefix}${nextNumber.toString().padStart(4, '0')}`;
      
      const updatedNumbering = { ...config.numbering };
      updatedNumbering.customer.nextNumber = nextNumber + 1;
      
      await prisma.systemconfigs.update({
        where: { id: config.id },
        data: { numbering: updatedNumbering }
      });
    }

    // Unique Constraint Validation
    const duplicateCheck = [];
    if (payload.email) duplicateCheck.push({ email: payload.email });
    if (payload.mobile) duplicateCheck.push({ mobile: payload.mobile });
    if (payload.gst) duplicateCheck.push({ gst: payload.gst });
    if (payload.pan) duplicateCheck.push({ pan: payload.pan });
    if (payload.customId) duplicateCheck.push({ customId: payload.customId });

    if (duplicateCheck.length > 0) {
      const existing = await prisma.customers.findFirst({
        where: { OR: duplicateCheck }
      });
      if (existing) {
        let field = 'Identity Property';
        if (existing.email === payload.email) field = 'Email';
        if (existing.mobile === payload.mobile) field = 'Mobile';
        if (existing.gst === payload.gst) field = 'GSTIN';
        if (existing.pan === payload.pan) field = 'PAN';
        if (existing.customId === payload.customId) field = 'Customer ID';
        return res.status(400).json({ message: `Protocol Conflict: ${field} already registered in the system.` });
      }
    }

    // Generate a secure random 10-character alphanumeric password
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randomPassword = '';
    for (let i = 0; i < 10; i++) {
      randomPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const password = req.body.password || randomPassword;
    payload.password = password;
    console.log(`[Customer Onboarding] Password for ${payload.email}: ${password}`);

    const newId = [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    payload.id = newId;
    payload.createdAt = new Date();
    payload.updatedAt = new Date();

    const newCustomer = await prisma.customers.create({ data: payload });

    try {
      if (newCustomer.email) {
        // Check if user already exists
        const existingUser = await prisma.users.findFirst({ where: { email: newCustomer.email } });
        if (existingUser) {
          return res.status(400).json({ message: 'A user account with this email already exists in the system.' });
        }
        
        const newUserId = [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
        await prisma.users.create({
          data: {
            id: newUserId,
            name: newCustomer.name || '',
            email: newCustomer.email,
            password: password,
            role: 'CUSTOMER',
            customerId: newCustomer.id,
            type: newCustomer.type || 'EMI',
            mustResetPassword: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });

        // Trigger Notification
        sendNotification('customer_welcome', {
          email: newCustomer.email,
          name: newCustomer.name,
          username: newCustomer.email,
          password: password,
          customId: newCustomer.customId,
          loginUrl: 'http://localhost:5173'
        }).catch(err => console.error('Delayed Notify Error:', err));
      }
      res.status(201).json({ ...newCustomer, _id: newCustomer.id });
    } catch (userError) {
      // Rollback primary creation if secondary fails
      await prisma.customers.delete({ where: { id: newCustomer.id } });
      res.status(400).json({ message: `Security Protocol Failure: ${userError.message}` });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const updateData = { ...req.body, updatedAt: new Date() };
    const updatedCustomer = await prisma.customers.update({
      where: { id: req.params.id },
      data: updateData
    });

    const userUpdate = { name: updatedCustomer.name || '', email: updatedCustomer.email || '', type: updatedCustomer.type || 'EMI', updatedAt: new Date() };
    if (req.body.password) {
      const bcrypt = await import('bcryptjs');
      const salt = await bcrypt.default.genSalt(10);
      userUpdate.password = await bcrypt.default.hash(req.body.password, salt);
      
      await prisma.customers.update({
        where: { id: req.params.id },
        data: { password: req.body.password }
      });
    }

    const existingUser = await prisma.users.findFirst({ where: { customerId: req.params.id } });
    if (existingUser) {
      await prisma.users.update({
        where: { id: existingUser.id },
        data: userUpdate
      });
    }

    res.json({ ...updatedCustomer, _id: updatedCustomer.id });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    const customer = await prisma.customers.findUnique({ where: { id: req.params.id } });
    if (customer) {
      await prisma.users.deleteMany({ where: { customerId: customer.id } });
      await prisma.customers.delete({ where: { id: req.params.id } });
    }
    res.json({ message: 'Customer and associated user purged' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const bulkUploadCustomers = async (req, res) => {
  try {
    const { customers } = req.body;
    
    if (!customers || !Array.isArray(customers) || customers.length === 0) {
      return res.status(400).json({ message: 'No customers provided for bulk upload.' });
    }

    const config = await prisma.systemconfigs.findFirst();
    let successCount = 0;
    const errors = [];

    for (let i = 0; i < customers.length; i++) {
      const payload = customers[i];
      try {
        // Auto-ID Generation if required
        if (config?.numbering?.customer?.mode === 'Auto' && !payload.customId) {
          const { prefix, nextNumber } = config.numbering.customer;
          payload.customId = `${prefix}${nextNumber.toString().padStart(4, '0')}`;
          config.numbering.customer.nextNumber += 1;
        }

        // Unique Constraint Validation
        const duplicateCheck = [];
        if (payload.email) duplicateCheck.push({ email: payload.email });
        if (payload.mobile) duplicateCheck.push({ mobile: payload.mobile });
        if (payload.gst) duplicateCheck.push({ gst: payload.gst });
        if (payload.pan) duplicateCheck.push({ pan: payload.pan });
        if (payload.customId) duplicateCheck.push({ customId: payload.customId });

        if (duplicateCheck.length > 0) {
          const existing = await prisma.customers.findFirst({
            where: { OR: duplicateCheck }
          });
          if (existing) {
            let field = 'Identity Property';
            if (existing.email === payload.email) field = 'Email';
            if (existing.mobile === payload.mobile) field = 'Mobile';
            if (existing.gst === payload.gst) field = 'GSTIN';
            if (existing.pan === payload.pan) field = 'PAN';
            if (existing.customId === payload.customId) field = 'Customer ID';
            errors.push({ row: i + 1, email: payload.email, error: `Protocol Conflict: ${field} already registered.` });
            continue; // Skip to next customer
          }
        }

        // Generate a secure random 10-character alphanumeric password
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let randomPassword = '';
        for (let j = 0; j < 10; j++) {
          randomPassword += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const password = payload.password || randomPassword;
        payload.password = password;

        const newId = [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
        payload.id = newId;
        payload.createdAt = new Date();
        payload.updatedAt = new Date();

        const newCustomer = await prisma.customers.create({ data: payload });

        if (newCustomer.email) {
          const existingUser = await prisma.users.findFirst({ where: { email: newCustomer.email } });
          if (existingUser) {
            await prisma.customers.delete({ where: { id: newCustomer.id } });
            errors.push({ row: i + 1, email: payload.email, error: 'A user account with this email already exists.' });
            continue;
          }
          
          const newUserId = [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
          await prisma.users.create({
            data: {
              id: newUserId,
              name: newCustomer.name || '',
              email: newCustomer.email,
              password: password,
              role: 'CUSTOMER',
              customerId: newCustomer.id,
              type: newCustomer.type || 'EMI',
              mustResetPassword: true,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
        }
        successCount++;
      } catch (err) {
        errors.push({ row: i + 1, email: payload.email, error: err.message });
      }
    }

    if (config) {
      await prisma.systemconfigs.update({
        where: { id: config.id },
        data: { numbering: config.numbering }
      });
    }

    res.status(200).json({
      message: `Bulk upload completed. Successfully added ${successCount} customers.`,
      successCount,
      errors
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
