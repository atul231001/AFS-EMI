import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Machine from './backend/models/Machine.js';

dotenv.config({ path: './backend/.env' });

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const p1 = await Machine.find({}).sort({ createdAt: -1, _id: -1 }).skip(0).limit(8);
  const p2 = await Machine.find({}).sort({ createdAt: -1, _id: -1 }).skip(8).limit(8);

  console.log('Page 1 IDs:', p1.map(m => m._id.toString()));
  console.log('Page 2 IDs:', p2.map(m => m._id.toString()));
  console.log('Overlap:', p1.filter(m => p2.map(p => p._id.toString()).includes(m._id.toString())).length);

  await mongoose.disconnect();
}
test();
