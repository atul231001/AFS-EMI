import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = "mongodb://project_emi:mFZZI94FVjWn4tdR@ac-pilur9b-shard-00-00.egu1mey.mongodb.net:27017,ac-pilur9b-shard-00-01.egu1mey.mongodb.net:27017,ac-pilur9b-shard-00-02.egu1mey.mongodb.net:27017/mydatabase?ssl=true&replicaSet=atlas-5ihvjw-shard-0&authSource=admin&retryWrites=true&w=majority";

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  customId: { type: String, unique: true },
  contactPerson: { type: String },
  mobile: { type: String },
  email: { type: String },
  gst: { type: String },
  pan: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  pincode: { type: String },
  type: { type: String, enum: ['EMI', 'Rental', 'FMC', 'EMI/Rentals'], default: 'EMI' },
  status: { type: String, enum: ['Active', 'Inactive', 'Defaulting'], default: 'Active' },
  riskCategory: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Low' },
  password: { type: String }
}, { timestamps: true });

const Customer = mongoose.models.Customer || mongoose.model('Customer', customerSchema);

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  customId: { type: String },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  password: { type: String, required: true },
  role: { type: String, enum: ['OEM', 'CUSTOMER', 'SUPERVISOR'], required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  type: { type: String }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

const seed = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    const passwordHash = await bcrypt.hash('password123', 10);
    const ts = Date.now();
    for (let i = 1; i <= 66; i++) {
      const email = `customer_emi_${i}_${ts}@example.com`;
      const cust = await Customer.create({
        name: `Seeded EMI Customer ${i}`,
        customId: `CUST-S-${ts.toString().slice(-4)}${i.toString().padStart(2, '0')}`,
        mobile: `777777${i.toString().padStart(4, '0')}`,
        email: email,
        pan: `ABCDE${i.toString().padStart(4, '0')}F`,
        city: 'Mumbai',
        state: 'Maharashtra',
        type: 'EMI',
        status: 'Active',
        password: passwordHash
      });
      await User.create({
        name: cust.name,
        email: cust.email,
        password: passwordHash,
        role: 'CUSTOMER',
        customerId: cust._id,
        type: cust.type
      });
    }
    console.log('Seeded 66 Customer documents successfully!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
seed();
