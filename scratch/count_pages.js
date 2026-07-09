import fs from 'fs';

function getPDFPageCount(filePath) {
  const buf = fs.readFileSync(filePath);
  const str = buf.toString('binary');
  
  // Find all "/Count X" entries in the PDF structure
  const matches = str.match(/\/Count\s+(\d+)/g);
  if (!matches) return null;
  
  const counts = matches.map(m => parseInt(m.match(/\d+/)[0]));
  return Math.max(...counts);
}

const files = fs.readdirSync('scratch').filter(f => f.startsWith('Agreement_Test_') && f.endsWith('.pdf'));
if (files.length === 0) {
  console.log('No generated PDF found');
} else {
  const file = `scratch/${files[0]}`;
  const pages = getPDFPageCount(file);
  console.log(`File: ${file}`);
  console.log(`Page count: ${pages}`);
}
process.exit(0);
