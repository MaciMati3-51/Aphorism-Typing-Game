const fs = require('fs');

const csvContent = fs.readFileSync('./usutaku_DB_final.csv', 'utf-8');
const lines = csvContent.split('\n').filter(line => line.trim());

console.log('Checking for entries with only single romaji pattern:\n');

let needsMultiplePatterns = [];

lines.forEach((line, index) => {
  const parts = line.split(',');
  if (parts.length < 2) return;
  
  const original = parts[0];
  const romajiPatterns = parts[1].split('|');
  
  // Check if it has shi/si, chi/ti, tsu/tu, fu/hu variations but only one pattern
  const romaji = parts[1];
  const hasVariants = 
    (romaji.includes('shi') || romaji.includes('si')) ||
    (romaji.includes('chi') || romaji.includes('ti')) ||
    (romaji.includes('tsu') || romaji.includes('tu')) ||
    (romaji.includes('fu') || romaji.includes('hu')) ||
    (romaji.includes('ji') || romaji.includes('zi')) ||
    (romaji.includes('sha') || romaji.includes('sya')) ||
    (romaji.includes('shu') || romaji.includes('syu')) ||
    (romaji.includes('sho') || romaji.includes('syo')) ||
    (romaji.includes('cha') || romaji.includes('tya')) ||
    (romaji.includes('chu') || romaji.includes('tyu')) ||
    (romaji.includes('cho') || romaji.includes('tyo')) ||
    (romaji.includes('ja') || romaji.includes('zya')) ||
    (romaji.includes('ju') || romaji.includes('zyu')) ||
    (romaji.includes('jo') || romaji.includes('zyo'));
  
  if (hasVariants && romajiPatterns.length === 1) {
    needsMultiplePatterns.push({
      lineNumber: index + 1,
      original: original,
      romaji: romaji
    });
  }
});

console.log(`Found ${needsMultiplePatterns.length} entries that may need multiple patterns:\n`);

needsMultiplePatterns.forEach(item => {
  console.log(`Line ${item.lineNumber}: ${item.original}`);
  console.log(`  Current: ${item.romaji}\n`);
});
