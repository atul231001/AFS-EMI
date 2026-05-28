import mongoose from 'mongoose';
import Role from '../backend/models/Role.js';
import User from '../backend/models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const checkDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/liugong_finance');
    console.log('Connected to DB:', mongoose.connection.name);
    
    const roles = await Role.find();
    console.log('ROLES:', roles.map(r => r.name));
    
    const users = await User.find();
    console.log('USERS_COUNT:', users.length);
    console.log('USERS_EMAILS:', users.map(u => u.email));
    
    const admin = await Role.findOne({ name: 'Admin' });
    console.log('ADMIN_ROLE:', admin ? 'FOUND' : 'MISSING');
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('DB_ERROR:', err);
  }
};

checkDB();
