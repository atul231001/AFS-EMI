import express from 'express';
import cors from 'cors';
import path from 'path';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

// Route Imports
import customerRoutes from './routes/customerRoutes.js';
import machineRoutes from './routes/machineRoutes.js';
import loanRoutes from './routes/loanRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import configRoutes from './routes/configRoutes.js';
import roleRoutes from './routes/roleRoutes.js';
import fmcRoutes from './routes/fmcRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import { initScheduler } from './services/schedulerService.js';

dotenv.config({ path: './backend/.env' });
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use((req, res, next) => {
  console.log(`>>> ${req.method} ${req.url}`);
  next();
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(process.cwd(), 'backend', 'uploads')));

// Routes
app.use('/api/customers', customerRoutes);
app.use('/api/machines', machineRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/config', configRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/fmc', fmcRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/', (req, res) => {
  res.send('EMI Platform API is running...');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  initScheduler();
});
