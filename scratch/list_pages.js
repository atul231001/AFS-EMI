import { getAgreementPages } from '../backend/services/agreementText.js';

const p = getAgreementPages({ formatINR: x => x });
console.log(`Total Pages in array: ${p.length}`);
p.forEach((content, i) => {
  // Extract h1 title or first h2 or first section-title
  const titleMatch = content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) ||
                     content.match(/<h2[^>]*>([\s\S]*?)<\/h2>/) ||
                     content.match(/class="section-title">([\s\S]*?)<\/div>/) ||
                     content.match(/<strong>(.*?)<\/strong>/);
  const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim().substring(0, 60) : 'No Title';
  console.log(`Page ${i + 1}: ${title}`);
});
process.exit(0);
