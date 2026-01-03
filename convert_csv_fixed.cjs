const fs = require('fs');

const csvContent = fs.readFileSync('./usutaku_DB_final.csv', 'utf-8');
const lines = csvContent.split('\n').filter(line => line.trim());

const aphorisms = lines.map((line, index) => {
  // Split only on the FIRST comma to separate Japanese from romaji
  const firstCommaIndex = line.indexOf(',');

  if (firstCommaIndex === -1) {
    console.warn('Warning: Could not parse line ' + (index + 1) + ': ' + line);
    return null;
  }

  const original = line.substring(0, firstCommaIndex);
  const romajiPart = line.substring(firstCommaIndex + 1);
  const romajiPatterns = romajiPart.split('|');

  return {
    id: index + 1,
    text: romajiPatterns[0],
    tokens: romajiPatterns,
    original: original
  };
}).filter(item => item !== null);

const outputContent = 'export const APHORISMS = ' + JSON.stringify(aphorisms, null, 4) + ';\n';

fs.writeFileSync('./src/data/usutakuData.js', outputContent, 'utf-8');

console.log('Converted ' + aphorisms.length + ' aphorisms from CSV to JavaScript');
console.log('Output written to src/data/usutakuData.js');
