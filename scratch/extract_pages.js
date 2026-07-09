import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

async function run() {
  const files = fs.readdirSync('scratch').filter(f => f.startsWith('Agreement_Test_') && f.endsWith('.pdf'));
  if (files.length === 0) {
    console.log('No generated PDF found');
    process.exit(0);
  }
  
  const file = `scratch/${files[0]}`;
  const dataBuffer = fs.readFileSync(file);
  
  const options = {
    pagerender: function(pageData) {
      return pageData.getTextContent().then(function(textContent) {
        let text = textContent.items.map(item => item.str).join(' ');
        console.log(`--- Page ${pageData.pageIndex + 1} ---`);
        console.log(text.substring(0, 150) || '(Empty Page)');
        return text;
      });
    }
  };
  
  let fn = pdf;
  if (typeof pdf !== 'function' && pdf.default) fn = pdf.default;
  if (typeof fn !== 'function' && typeof pdf === 'object' && pdf !== null) {
    fn = pdf[Object.keys(pdf)[0]];
  }
  
  await fn(dataBuffer, options);
  process.exit(0);
}

run().catch(console.error);
