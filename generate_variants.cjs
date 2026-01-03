const fs = require('fs');

function generateRomajiVariants(romaji) {
  const variants = new Set([romaji]);

  const patterns = [
    { from: 'shi', to: 'si' },
    { from: 'chi', to: 'ti' },
    { from: 'tsu', to: 'tu' },
    { from: 'sha', to: 'sya' },
    { from: 'shu', to: 'syu' },
    { from: 'sho', to: 'syo' },
    { from: 'cha', to: 'tya' },
    { from: 'chu', to: 'tyu' },
    { from: 'cho', to: 'tyo' },
    { from: 'fu', to: 'hu' },
    { from: 'ji', to: 'zi' },
    { from: 'ja', to: 'zya' },
    { from: 'ju', to: 'zyu' },
    { from: 'jo', to: 'zyo' },
  ];

  function generateCombinations(str, patternIndex) {
    if (patternIndex >= patterns.length) {
      variants.add(str);
      return;
    }

    const pattern = patterns[patternIndex];
    generateCombinations(str, patternIndex + 1);

    let pos = 0;
    while ((pos = str.indexOf(pattern.from, pos)) !== -1) {
      const replaced = str.substring(0, pos) + pattern.to + str.substring(pos + pattern.from.length);
      generateCombinations(replaced, patternIndex + 1);
      pos += pattern.from.length;
    }

    pos = 0;
    while ((pos = str.indexOf(pattern.to, pos)) !== -1) {
      const replaced = str.substring(0, pos) + pattern.from + str.substring(pos + pattern.to.length);
      generateCombinations(replaced, patternIndex + 1);
      pos += pattern.to.length;
    }
  }

  generateCombinations(romaji, 0);
  return Array.from(variants).sort();
}

const csvContent = fs.readFileSync('./usutaku_DB_final.csv', 'utf-8');
const lines = csvContent.split('\n');

const updatedLines = lines.map((line, index) => {
  const trimmedLine = line.trim();
  if (!trimmedLine) return line;

  const parts = trimmedLine.split(',');
  if (parts.length < 2) return line;

  const original = parts[0];
  const currentPatterns = parts[1].split('|').map(p => p.trim());

  const allVariants = generateRomajiVariants(currentPatterns[0]);
  const combined = [...new Set([...allVariants, ...currentPatterns])];

  if (combined.length > currentPatterns.length) {
    console.log('Line ' + (index + 1) + ': ' + original);
    console.log('  Added ' + (combined.length - currentPatterns.length) + ' new variants');
  }

  return original + ',' + combined.join('|');
});

fs.writeFileSync('./usutaku_DB_final.csv', updatedLines.join('\n'), 'utf-8');
console.log('\nCSV updated successfully!');
