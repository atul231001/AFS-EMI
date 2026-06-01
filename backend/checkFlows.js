import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const ApprovalFlow = (await import('./models/ApprovalFlow.js')).default;
    const testDoc = new ApprovalFlow({
      name: 'Test Financing Flow',
      type: 'FINANCING',
      steps: []
    });
    await testDoc.save();
    console.log("Saved Test Financing Flow successfully!");
    
    const flows = await ApprovalFlow.find({});
    console.log("FLOWS IN DB:");
    flows.forEach(f => {
      console.log(`- ID: ${f._id}, Name: ${f.name}, Type: ${f.type}, Supervisor: ${f.supervisorId}`);
    });
    await ApprovalFlow.findByIdAndDelete(testDoc._id);
    mongoose.connection.close();
  });
