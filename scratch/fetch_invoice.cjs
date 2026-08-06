const https = require('https');

const data = new TextEncoder().encode('');
const options = {
  hostname: 'lipl.sods.app',
  port: 443,
  path: '/api/dmobile/getInvoiceDetails?invoice_number=LIPLMP2627-1593',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, res => {
  let body = '';
  res.on('data', d => {
    body += d;
  });
  res.on('end', () => {
    console.log(body);
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
