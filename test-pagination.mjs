const p1Req = await fetch('http://localhost:5000/api/machines?paginated=true&page=1&limit=8');
const p1 = await p1Req.json();
const p18Req = await fetch('http://localhost:5000/api/machines?paginated=true&page=18&limit=8');
const p18 = await p18Req.json();

if (p1.message) {
  console.log('Error:', p1.message);
} else {
  console.log('Page 1 items:', p1.machines?.length, 'Page 18 items:', p18.machines?.length);
  console.log('Page 1 first id:', p1.machines?.[0]?._id, 'Page 18 first id:', p18.machines?.[0]?._id);
  console.log('Page 1 is equal to Page 18?', JSON.stringify(p1.machines) === JSON.stringify(p18.machines));
}
