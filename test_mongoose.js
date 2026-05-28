import mongoose from 'mongoose';
import { default as Machine } from './backend/models/Machine.js';

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/emi_test_db');
  const m = new Machine({
    name: 'test',
    category: 'Crawler',
    model: 'test_model',
    images: null,
    img: 'base64_fake_data',
    pricing: null,
    specs: null,
    warranty: null,
    attachments: null
  });
  await m.save();
  const saved = await Machine.findById(m._id).lean();
  console.log(JSON.stringify(saved, null, 2));
  process.exit(0);
}
run().catch(console.error);
