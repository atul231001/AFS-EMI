import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const User = (await import('./backend/models/User.js')).default;
    const user = await User.findOne({ email: 'silicontraders45@gmail.com' }).lean();
    console.log(`User ID: ${user._id}`);
    process.exit(0);
  })
  .catch(err => console.error(err));
