import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const ApprovalFlow = (await import('./models/ApprovalFlow.js')).default;
    const flows = await ApprovalFlow.find({});
    
    // We want to find flows where supervisorId is an Employee, but type is TICKET.
    // Easiest way: fetch all employees from DB.
    const User = (await import('./models/User.js')).default;
    const employees = await User.find({ role: 'EMPLOYEE' });
    const empIds = employees.map(e => e._id.toString());
    
    let updated = 0;
    for (let f of flows) {
      if (f.type === 'TICKET' && empIds.includes(f.supervisorId)) {
        f.type = 'FINANCING';
        await f.save();
        updated++;
        console.log(`Updated Employee flow ${f.name} to FINANCING`);
      }
    }
    
    // What about "UV"? In the screenshot, UV has "SUPERVISORS: VIKAS, SUPERVISOR DAVE". 
    // This means UV was created for a supervisor. So it SHOULD be in the Ticket tab.
    // Wait, the user was complaining about FINANCING flow showing in TICKET tab. 
    console.log(`Updated ${updated} flows to FINANCING.`);
    mongoose.connection.close();
  });
