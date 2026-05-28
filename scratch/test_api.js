import http from 'http';

const test = (path, method = 'GET', body = null) => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });

    req.on('error', (e) => resolve({ error: e.message }));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
};

const run = async () => {
  console.log('--- TESTING API ---');
  const getRes = await test('/api/roles');
  console.log('GET /api/roles:', getRes);

  const postRes = await test('/api/roles', 'POST', { name: 'DIAGNOSTIC_' + Date.now() });
  console.log('POST /api/roles:', postRes);
};

run();
