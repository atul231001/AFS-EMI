import fs from 'fs';
import path from 'path';

const dir = 'd:/AFS/backend/routes/app';
const files = fs.readdirSync(dir);
for (const file of files) {
  if (file.endsWith('.js')) {
    const filepath = path.join(dir, file);
    let content = fs.readFileSync(filepath, 'utf8');
    content = content.replace(/from '\.\.\/models\//g, "from '../../models/");
    fs.writeFileSync(filepath, content);
  }
}
console.log('Fixed imports in routes/app');
