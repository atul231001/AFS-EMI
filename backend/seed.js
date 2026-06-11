import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = "mongodb://project_emi:mFZZI94FVjWn4tdR@ac-pilur9b-shard-00-00.egu1mey.mongodb.net:27017,ac-pilur9b-shard-00-01.egu1mey.mongodb.net:27017,ac-pilur9b-shard-00-02.egu1mey.mongodb.net:27017/mydatabase?ssl=true&replicaSet=atlas-5ihvjw-shard-0&authSource=admin&retryWrites=true&w=majority";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  customId: { type: String },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  password: { type: String, required: true },
  role: { type: String, enum: ['OEM', 'CUSTOMER', 'SUPERVISOR'], required: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

const seedEmployees = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');
    
    const password = await bcrypt.hash('password123', 10);
    const employees = [];
    
    for (let i = 1; i <= 25; i++) {
      employees.push({
        name: `Test Employee ${i}`,
        customId: `EMP-${Date.now().toString().slice(-4)}${i}`,
        email: `test_employee_${i}_${Date.now()}@liugong.com`,
        phone: `999999${i.toString().padStart(4, '0')}`,
        password,
        role: 'OEM',
        status: 'Active'
      });
    }

    await User.insertMany(employees);
    console.log('Successfully inserted 25 employees!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding:', error);
    process.exit(1);
  }
};

seedEmployees();
