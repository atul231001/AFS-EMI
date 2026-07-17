const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../frontend/src/components');

function processDir(dirPath) {
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // We will match .toLocaleDateString(...) including newlines
      // We also might have .toUpperCase() after it in some places, but let's just replace the function call.
      const regex = /\.toLocaleDateString\([^)]*\)/g;
      
      if (regex.test(content)) {
        content = content.replace(regex, ".toLocaleDateString('en-CA')");
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated:', fullPath);
      }
    }
  }
}

processDir(dir);
console.log('Done');
