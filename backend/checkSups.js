import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const User = (await import('./models/User.js')).default;
    const FMCSupervisor = (await import('./models/FMCSupervisor.js')).default;
    
    const users = await User.find({});
    const sups = await FMCSupervisor.find({});
    
    console.log("USERS:", users.map(u => ({ name: u.name, role: u.role })));
    console.log("SUPS:", sups.map(s => ({ name: s.name })));
    mongoose.connection.close();
  });
