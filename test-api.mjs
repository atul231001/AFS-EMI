import fs from 'fs';

async function test() {
  const p1Req = await fetch('http://localhost:5000/api/machines?paginated=true&page=1&limit=2');
  const p1 = await p1Req.json();
  const p2Req = await fetch('http://localhost:5000/api/machines?paginated=true&page=2&limit=2');
  const p2 = await p2Req.json();

  console.log('Page 1:', p1.machines?.map(m => m.name));
  console.log('Page 2:', p2.machines?.map(m => m.name));
}
test();
