import jwt from 'jsonwebtoken';
import http from 'http';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

const token = jwt.sign({ id: '6a327e92f100c6cb8a789de9' }, process.env.JWT_SECRET || 'liugong_strategic_analytics_secure_key_2026', { expiresIn: '1h' });

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/loans',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    try {
      const loans = JSON.parse(data);
      console.log(`Fetched ${loans.length} loans.`);
      console.log(JSON.stringify(loans[0].schedule, null, 2));
    } catch(e) {
      console.log('Error parsing JSON:', data.substring(0, 100));
    }
  });
});
req.on('error', e => console.error(e));
req.end();
