const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  try {
    const files = fs.readdirSync(dir);
    files.forEach(f => {
      let dirPath = path.join(dir, f);
      let stat = fs.statSync(dirPath);
      if (stat.isDirectory()) {
        walkDir(dirPath, callback);
      } else {
        callback(dirPath);
      }
    });
  } catch (e) {
    console.error(`Error reading dir ${dir}: ${e.message}`);
  }
}

const srcDir = path.join(process.cwd(), 'src');
console.log(`Starting scan in: ${srcDir}`);
let visited = 0;
let matched = 0;
let updated = 0;

walkDir(srcDir, (filePath) => {
  visited++;
  if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const regex = /loader\s*=\s*\{imageLoader\}/g;
      if (regex.test(content)) {
        matched++;
        console.log(`Match found in: ${filePath}`);
        // Simple replace
        const newContent = content.replace(regex, 'unoptimized');
        fs.writeFileSync(filePath, newContent, 'utf8');
        updated++;
        console.log(`UPDATED: ${filePath}`);
      }
    } catch (e) {
      console.error(`Error processing ${filePath}: ${e.message}`);
    }
  }
});

console.log(`Scan complete.`);
console.log(`Visited: ${visited}`);
console.log(`Matched: ${matched}`);
console.log(`Updated: ${updated}`);
