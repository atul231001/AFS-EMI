import mongoose from 'mongoose';

const systemConfigSchema = new mongoose.Schema({
  categories: { type: [String], default: ['Wheeled', 'Crawler'] },
  dieselTypes: { type: [String], default: ['BS IV', 'BS V', 'BS VI'] },
  evTypes: { type: [String], default: ['Lithium-Ion', 'LFP', 'Hydrogen Cell'] },
  transmissionTypes: { type: [String], default: ['Manual', 'Automatic', 'Hydrostatic (HST)', 'Power Shift', 'CVT', 'Electric Drive'] },
  attachmentTypes: { type: [String], default: ['Bucket', 'Fork', 'Grapple'] },
  numbering: {
    customer: { 
      mode: { type: String, enum: ['Manual', 'Auto'], default: 'Manual' }, 
      prefix: { type: String, default: 'CUST' },
      nextNumber: { type: Number, default: 1 }
    },
    employee: { 
      mode: { type: String, enum: ['Manual', 'Auto'], default: 'Manual' }, 
      prefix: { type: String, default: 'EMP' },
      nextNumber: { type: Number, default: 1 }
    },
    supervisor: { 
      mode: { type: String, enum: ['Manual', 'Auto'], default: 'Manual' }, 
      prefix: { type: String, default: 'SUP' },
      nextNumber: { type: Number, default: 1 }
    }
  },
  security: {
    captcha: {
      onboardClient: { type: Boolean, default: false },
      authorizePersonnel: { type: Boolean, default: false },
      onboardSupervisor: { type: Boolean, default: false }
    }
  },
  customerColumns: {
    name: { type: Boolean, default: true },
    customId: { type: Boolean, default: true },
    mobile: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    gst: { type: Boolean, default: true },
    pan: { type: Boolean, default: true },
    bankAcc: { type: Boolean, default: true },
    ifsc: { type: Boolean, default: true },
    status: { type: Boolean, default: true },
    type: { type: Boolean, default: true },
    city: { type: Boolean, default: true },
    pin: { type: Boolean, default: true },
    address: { type: Boolean, default: true },
    control: { type: Boolean, default: true }
  },
  employeeColumns: {
    name: { type: Boolean, default: true },
    customId: { type: Boolean, default: true },
    phone: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    role: { type: Boolean, default: true },
    status: { type: Boolean, default: true },
    control: { type: Boolean, default: true }
  },
  machineColumns: {
    identity: { type: Boolean, default: true },
    status: { type: Boolean, default: true },
    specs: { type: Boolean, default: true },
    valuation: { type: Boolean, default: true },
    dataSync: { type: Boolean, default: true },
    control: { type: Boolean, default: true }
  },
  notifications: {
    customer_welcome: { type: Boolean, default: true },
    employee_welcome: { type: Boolean, default: true },
    emi_reminder: { type: Boolean, default: false },
    overdue_alert: { type: Boolean, default: false },
    overdue_interval: { type: Number, default: 7 }
  },
  smtp: {
    host: { type: String, default: 'smtp.gmail.com' },
    port: { type: Number, default: 587 },
    user: { type: String, default: '' },
    pass: { type: String, default: '' },
    from: { type: String, default: 'EMI Portal <no-reply@emiportal.com>' },
    secure: { type: Boolean, default: false }
  }
}, { timestamps: true });

export default mongoose.model('SystemConfig', systemConfigSchema);
