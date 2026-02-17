const fs = require('fs');
const path = require('path');

const testFile = path.join(process.cwd(), 'src/features/Home/CategoryRank.tsx');
if (fs.existsSync(testFile)) {
  console.log(`File exists: ${testFile}`);
  const content = fs.readFileSync(testFile, 'utf8');
  console.log(`Content length: ${content.length}`);
  const regex = /loader\s*=\s*\{imageLoader\}/g;
  if (regex.test(content)) {
    console.log('Regex MATCHED!');
  } else {
    console.log('Regex NOT MATCHED');
    console.log('Snippet:', content.substring(0, 500)); 
  }
} else {
  console.log(`File NOT found: ${testFile}`);
}
