import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const Machine = (await import('./backend/models/Machine.js')).default;
    const machines = await Machine.find({}).lean();
    for (let m of machines) {
      console.log(`Machine Name: "${m.name}", Model: "${m.model}"`);
    }
    process.exit(0);
  })
  .catch(err => console.error(err));
