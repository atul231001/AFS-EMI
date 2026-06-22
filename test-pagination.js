const http = require('http');

http.get('http://localhost:5000/api/machines?paginated=true&page=1&limit=8', (res) => {
  let data1 = '';
  res.on('data', chunk => data1 += chunk);
  res.on('end', () => {
    http.get('http://localhost:5000/api/machines?paginated=true&page=18&limit=8', (res2) => {
      let data2 = '';
      res2.on('data', chunk => data2 += chunk);
      res2.on('end', () => {
        try {
          const p1 = JSON.parse(data1);
          const p18 = JSON.parse(data2);
          if (p1.message || p18.message) {
            console.log('Error from API:', p1.message || p18.message);
          } else {
            console.log('Page 1 items:', p1.machines.length, 'Page 18 items:', p18.machines.length);
            console.log('Page 1 first id:', p1.machines[0]?._id, 'Page 18 first id:', p18.machines[0]?._id);
            console.log('Page 1 is equal to Page 18?', JSON.stringify(p1.machines) === JSON.stringify(p18.machines));
          }
        } catch (e) {
          console.error('Failed to parse:', e);
        }
      });
    });
  });
});
