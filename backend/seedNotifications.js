import mongoose from 'mongoose';
import NotificationTemplate from './models/NotificationTemplate.js';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

const seedTemplates = [
  {
    name: 'Customer Welcome Email',
    event: 'customer_welcome',
    subject: 'Welcome to the EMI Portal: {{name}}',
    body: `Hello {{name}},

Your account has been set up on the EMI Portal. Here are your login details:

Username: {{username}}
Password: {{password}}
Customer ID: {{customId}}

You can log in here: {{loginUrl}}

Thank you,
LiuGong Finance Team`,
    variables: [
      { key: 'name', label: 'Full Name' },
      { key: 'username', label: 'Username' },
      { key: 'password', label: 'Password' },
      { key: 'customId', label: 'Customer ID' },
      { key: 'loginUrl', label: 'Login Link' }
    ]
  },
  {
    name: 'Staff Account Setup',
    event: 'employee_welcome',
    subject: 'Your Account Credentials: {{name}}',
    body: `Hello {{name}},

Your staff account is now ready on the EMI Portal. Here are your credentials:

Username: {{username}}
Password: {{password}}
Employee ID: {{customId}}

Log in here: {{loginUrl}}

Authorized Personnel Only.`,
    variables: [
      { key: 'name', label: 'Full Name' },
      { key: 'username', label: 'Username' },
      { key: 'password', label: 'Password' },
      { key: 'customId', label: 'Employee ID' },
      { key: 'loginUrl', label: 'Login Link' }
    ]
  }
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB for seeding templates...');
    
    for (const t of seedTemplates) {
      await NotificationTemplate.findOneAndUpdate(
        { event: t.event },
        t,
        { upsert: true, new: true }
      );
      console.log(`Seeded/Updated template: ${t.name}`);
    }
    
    console.log('Seeding complete.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seed();
