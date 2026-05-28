import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  permissions: {
    dashboard: {
      read: { type: Boolean, default: true }
    },
    customers: {
      read: { type: Boolean, default: true },
      create: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    machines: {
      read: { type: Boolean, default: true },
      create: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    financing: {
      read: { type: Boolean, default: true },
      create: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    new_financing: {
      read: { type: Boolean, default: true },
      create: { type: Boolean, default: false }
    },
    financed_machines: {
      read: { type: Boolean, default: true },
      update: { type: Boolean, default: false }
    },
    settlements: {
      read: { type: Boolean, default: true },
      create: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    employees: {
      read: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    settings_parent: {
      read: { type: Boolean, default: true }
    },
    settings_general: {
      read: { type: Boolean, default: true },
      update: { type: Boolean, default: false }
    },
    settings_rbac: {
      read: { type: Boolean, default: false },
      update: { type: Boolean, default: false }
    },
    fmc: {
      read: { type: Boolean, default: true },
      create: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    service_desk: {
      read: { type: Boolean, default: true },
      create: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    }
  }
}, { timestamps: true });

export default mongoose.model('Role', roleSchema);
