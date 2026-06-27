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
import dispatchRoutes from './routes/dispatchRoutes.js';

// App Independent Route Imports
import appCustomerRoutes from './routes/app/customerRoutes.js';
import appMachineRoutes from './routes/app/machineRoutes.js';
import appLoanRoutes from './routes/app/loanRoutes.js';
import appPaymentRoutes from './routes/app/paymentRoutes.js';
import appAuthRoutes from './routes/app/authRoutes.js';
import appUserRoutes from './routes/app/userRoutes.js';
import appConfigRoutes from './routes/app/configRoutes.js';
import appRoleRoutes from './routes/app/roleRoutes.js';
import appFmcRoutes from './routes/app/fmcRoutes.js';
import appNotificationRoutes from './routes/app/notificationRoutes.js';
import appReportRoutes from './routes/app/reportRoutes.js';
import appUploadRoutes from './routes/app/uploadRoutes.js';
import appDispatchRoutes from './routes/app/dispatchRoutes.js';
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
app.use('/api/dispatch', dispatchRoutes);

// App Independent Routes
app.use('/api/app/customers', appCustomerRoutes);
app.use('/api/app/machines', appMachineRoutes);
app.use('/api/app/loans', appLoanRoutes);
app.use('/api/app/payments', appPaymentRoutes);
app.use('/api/app/auth', appAuthRoutes);
app.use('/api/app/users', appUserRoutes);
app.use('/api/app/config', appConfigRoutes);
app.use('/api/app/roles', appRoleRoutes);
app.use('/api/app/fmc', appFmcRoutes);
app.use('/api/app/notifications', appNotificationRoutes);
app.use('/api/app/reports', appReportRoutes);
app.use('/api/app/upload', appUploadRoutes);
app.use('/api/app/dispatch', appDispatchRoutes);

app.get('/', (req, res) => {
  res.send('EMI Platform API is running...');
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    initScheduler();
  });
}

export default app;
