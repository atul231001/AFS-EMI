import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const ApprovalFlow = (await import('./models/ApprovalFlow.js')).default;
    const flows = await ApprovalFlow.find({});
    
    let updated = 0;
    for (let f of flows) {
      if (f.name.toLowerCase().includes('ag') || f.name.toLowerCase().includes('oem')) {
        f.type = 'FINANCING';
        await f.save();
        updated++;
        console.log(`Updated flow ${f.name} to FINANCING`);
      }
    }
    console.log(`Updated ${updated} flows.`);
    mongoose.connection.close();
  });
