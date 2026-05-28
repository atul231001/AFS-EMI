import mongoose from 'mongoose';
import Role from '../backend/models/Role.js';
import User from '../backend/models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const bootstrap = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mydatabase');
    console.log('Connected to DB:', mongoose.connection.name);
    
    const fullPermissions = {
      dashboard: { read: true },
      customers: { read: true, create: true, update: true, delete: true },
      machines: { read: true, create: true, update: true, delete: true },
      financing: { read: true, create: true, update: true, delete: true },
      settlements: { read: true, create: true, update: true, delete: true },
      employees: { read: true, create: true, update: true, delete: true },
      settings: { read: true, update: true }
    };

    let adminRole = await Role.findOne({ name: 'Admin' });
    if (!adminRole) {
      adminRole = await Role.create({ 
        name: 'Admin', 
        description: 'Master Administrator with unrestricted access', 
        permissions: fullPermissions 
      });
      console.log('Admin role created');
    } else {
      adminRole.permissions = fullPermissions;
      await adminRole.save();
      console.log('Admin role updated');
    }
    
    const oem = await User.findOne({ email: 'oem@liugong.com' });
    if (oem) {
      oem.roleId = adminRole._id;
      await oem.save();
      console.log('Assigned Admin role to oem@liugong.com');
    } else {
      console.log('oem@liugong.com not found');
    }
    
    await mongoose.disconnect();
    console.log('Bootstrap complete');
  } catch (err) {
    console.error('BOOTSTRAP_ERROR:', err);
  }
};

bootstrap();
