const fs = require('fs');

const lines = fs.readFileSync('./usutaku_DB_final.csv', 'utf-8').split('\n');

console.log('=== Checking for issues ===\n');

console.log('1. Missing punctuation in romaji:');
let missingComma = 0;
lines.forEach((line, i) => {
  const parts = line.split(',');
  if (parts[0] && parts[0].includes('、')) {
    const romaji = parts[1] ? parts[1].split('|')[0] : '';
    if (!romaji.includes(',')) {
      missingComma++;
      if (missingComma <= 5) {
        console.log('  Line ' + (i+1) + ': ' + parts[0].substring(0, 40));
        console.log('    Romaji: ' + romaji.substring(0, 60));
      }
    }
  }
});
console.log('Total entries missing comma: ' + missingComma);
console.log('');

console.log('2. Entries with consecutive shi (should have si variants):');
let consecutiveShi = 0;
lines.forEach((line, i) => {
  const parts = line.split(',');
  const romaji = parts[1] ? parts[1].split('|')[0] : '';

  // Check for patterns like "shishi", "oishii", etc
  if (romaji.match(/shi.*shi/i)) {
    consecutiveShi++;
    if (consecutiveShi <= 5) {
      console.log('  Line ' + (i+1) + ': ' + parts[0].substring(0, 40));
      console.log('    Pattern found: ' + romaji.substring(0, 60));

      // Check if variants exist
      const variants = parts[1] ? parts[1].split('|') : [];
      const hasSiVariant = variants.some(v => v.includes('si'));
      console.log('    Has si variant? ' + hasSiVariant);
    }
  }
});
console.log('Total entries with consecutive shi: ' + consecutiveShi);
console.log('');

console.log('3. Checking ha/wa coverage:');
let haEntries = 0;
let missingWa = 0;
lines.forEach((line, i) => {
  const parts = line.split(',');
  const romaji = parts[1] ? parts[1] : '';

  if (romaji.includes('ha')) {
    haEntries++;
    const variants = romaji.split('|');
    const hasWa = variants.some(v => v.includes('wa'));
    if (!hasWa) {
      missingWa++;
      if (missingWa <= 5) {
        console.log('  Line ' + (i+1) + ': ' + parts[0].substring(0, 40));
        console.log('    Has ha but missing wa variant');
      }
    }
  }
});
console.log('Entries with ha: ' + haEntries);
console.log('Missing wa variant: ' + missingWa);
