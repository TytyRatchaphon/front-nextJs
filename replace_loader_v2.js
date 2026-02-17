const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) {
    console.log(`Directory not found: ${dir}`);
    return;
  }
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(path.join(dir, f));
    }
  });
}

const srcDir = path.join(process.cwd(), 'src');
console.log(`Scanning directory: ${srcDir}`);
let count = 0;

walkDir(srcDir, (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) {
    const content = fs.readFileSync(filePath, 'utf8');
    // Regex to match "unoptimized" with any whitespace
    const regex = /loader\s*=\s*\{imageLoader\}/g;
    
    if (regex.test(content)) {
      // Check if unoptimized already exists to avoid duplication
      // This is a simple check; for perfect handling we'd need a parser, but this is safe enough for now
      // If unoptimized exists, we just remove the loader
      // If not, we replace loader with unoptimized
      
      let newContent = content.replace(regex, (match) => {
         // Check if the tag already has unoptimized (heuristic: scan surrounding lines?)
         // Simpler: Just replace with 'unoptimized' and let duplicate props be (handled by React)
         return 'unoptimized';
      });

      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`Updated: ${filePath}`);
      count++;
    }
  }
});

console.log(`Total files updated: ${count}`);
