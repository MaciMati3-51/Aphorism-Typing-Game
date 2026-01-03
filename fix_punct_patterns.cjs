const fs = require('fs');

// Pattern-based punctuation insertion
function insertPunctuationByPattern(japanese, romaji) {
  let result = romaji;

  // Common patterns before punctuation
  const patterns = [
    // Pattern: Japanese ending + punctuation -> romaji ending + punctuation
    { jp: 'とは、', romaji: ['toha,', 'towa,'] },
    { jp: 'である。', romaji: ['dearu.'] },
    { jp: 'です。', romaji: ['desu.'] },
    { jp: 'だ。', romaji: ['da.'] },
    { jp: 'だろう、', romaji: ['darou,', 'daroo,'] },
    { jp: 'ある。', romaji: ['aru.'] },
    { jp: 'いる。', romaji: ['iru.'] },
    { jp: 'する。', romaji: ['suru.'] },
    { jp: 'なる。', romaji: ['naru.'] },
    { jp: 'う！', romaji: ['u!'] },
    { jp: 'い！', romaji: ['i!'] },
    { jp: 'る？', romaji: ['ru?'] },
    { jp: 'か？', romaji: ['ka?'] },
    { jp: 'た。', romaji: ['ta.'] },
    { jp: 'て。', romaji: ['te.'] },
    { jp: 'し、', romaji: ['shi,', 'si,'] },
    { jp: 'く、', romaji: ['ku,'] },
    { jp: 'る、', romaji: ['ru,'] },
    { jp: 'て、', romaji: ['te,'] },
    { jp: 'が、', romaji: ['ga,'] },
    { jp: 'を、', romaji: ['wo,', 'o,'] },
    { jp: 'に、', romaji: ['ni,'] },
    { jp: 'の、', romaji: ['no,'] },
    { jp: 'は、', romaji: ['ha,', 'wa,'] },
    { jp: 'も、', romaji: ['mo,'] },
    { jp: 'な、', romaji: ['na,'] },
    { jp: 'ね、', romaji: ['ne,'] },
    { jp: 'よ、', romaji: ['yo,'] },
  ];

  // Try to find matching patterns
  for (const pattern of patterns) {
    if (japanese.includes(pattern.jp)) {
      // Find the plain version (without punct) in romaji
      const jpPlain = pattern.jp.replace(/[、。！？]/g, '');

      // Get all possible romaji plain versions
      const romajiPlains = pattern.romaji.map(r => r.replace(/[,\.!?]/g, ''));

      // Find which one exists in the current romaji
      for (let i = 0; i < romajiPlains.length; i++) {
        const romajiPlain = romajiPlains[i];
        const romajiWithPunct = pattern.romaji[i];

        if (result.includes(romajiPlain)) {
          // Replace with punctuated version
          result = result.replace(romajiPlain, romajiWithPunct);
          break;
        }
      }
    }
  }

  return result;
}

// Read CSV
const csvContent = fs.readFileSync('./usutaku_DB_final.csv', 'utf-8');
const lines = csvContent.split('\n');

console.log('Fixing punctuation using pattern matching...\n');

let fixed = 0;
const results = [];

const updatedLines = lines.map((line, index) => {
  const trimmedLine = line.trim();
  if (!trimmedLine) return line;

  const firstCommaIndex = trimmedLine.indexOf(',');
  if (firstCommaIndex === -1) return line;

  const japanese = trimmedLine.substring(0, firstCommaIndex);
  const romajiPart = trimmedLine.substring(firstCommaIndex + 1);
  const currentPatterns = romajiPart.split('|').map(p => p.trim());
  const firstPattern = currentPatterns[0];

  // Check if Japanese has punctuation but romaji doesn't
  const japaneseHasPunct = japanese.match(/[、。！？]/);
  const romajiHasPunct = firstPattern.match(/[,\.!?]/);

  if (japaneseHasPunct && !romajiHasPunct) {
    const fixedRomaji = insertPunctuationByPattern(japanese, firstPattern);

    if (fixedRomaji !== firstPattern) {
      fixed++;
      results.push({
        line: index + 1,
        japanese: japanese,
        before: firstPattern,
        after: fixedRomaji
      });

      if (fixed <= 20) {
        console.log('Line ' + (index + 1) + ': ' + japanese);
        console.log('  Before: ' + firstPattern);
        console.log('  After:  ' + fixedRomaji);
        console.log('');
      }
    }

    return japanese + ',' + fixedRomaji;
  }

  return line;
});

fs.writeFileSync('./usutaku_DB_fixed_patterns.csv', updatedLines.join('\n'), 'utf-8');
console.log('\nFixed ' + fixed + ' entries using pattern matching');
console.log('Output written to: usutaku_DB_fixed_patterns.csv');

fs.writeFileSync('./pattern_fixes.log', JSON.stringify(results, null, 2), 'utf-8');
console.log('Detailed log written to: pattern_fixes.log');
