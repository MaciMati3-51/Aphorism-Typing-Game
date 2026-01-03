const fs = require('fs');

// Map Japanese characters to their romaji equivalents
const hiraganaToRomaji = {
  'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
  'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
  'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
  'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
  'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
  'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
  'だ': 'da', 'ぢ': 'ji', 'づ': 'zu', 'で': 'de', 'ど': 'do',
  'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
  'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
  'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
  'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
  'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
  'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
  'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
  'わ': 'wa', 'を': 'wo', 'ん': 'n'
};

// Insert punctuation based on pattern matching
function insertPunctuationPattern(japanese, romaji) {
  let result = romaji;

  // Find punctuation positions
  for (let i = 0; i < japanese.length; i++) {
    const char = japanese[i];

    if (char === '、' || char === '。' || char === '！' || char === '？') {
      // Get the character before the punctuation
      if (i > 0) {
        const prevChar = japanese[i - 1];
        const prevChar2 = i > 1 ? japanese[i - 2] : '';

        // Try to find the romaji representation
        let searchPattern = '';

        if (hiraganaToRomaji[prevChar]) {
          searchPattern = hiraganaToRomaji[prevChar];
        } else if (hiraganaToRomaji[prevChar2]) {
          searchPattern = hiraganaToRomaji[prevChar2];
        }

        // Convert punctuation
        const punctChar = char === '、' ? ',' : char === '。' ? '.' : char === '！' ? '!' : '?';

        if (searchPattern) {
          // Find the last occurrence of this pattern before the punctuation
          const index = result.lastIndexOf(searchPattern);
          if (index !== -1) {
            const insertPos = index + searchPattern.length;
            result = result.slice(0, insertPos) + punctChar + result.slice(insertPos);
          }
        }
      }
    }
  }

  return result;
}

// Better approach: manually fix based on Japanese text analysis
function insertPunctuationManual(japanese, romaji) {
  // This is a manual mapping based on common patterns
  // We'll split by punctuation and reassemble

  // For simple cases: one comma or period
  if (japanese.includes('、') && !japanese.includes('。')) {
    // Find position of comma
    const parts = japanese.split('、');
    if (parts.length === 2) {
      // Estimate where to put the comma in romaji
      // Use a heuristic: characters before comma / total characters (excluding punct)
      const totalChars = japanese.replace(/[、。！？]/g, '').length;
      const beforeCommaChars = parts[0].length;
      const ratio = beforeCommaChars / totalChars;

      const insertPos = Math.round(romaji.length * ratio);
      return romaji.slice(0, insertPos) + ',' + romaji.slice(insertPos);
    }
  }

  if (japanese.includes('。') && !japanese.includes('、')) {
    // Periodat the end usually
    if (japanese.endsWith('。')) {
      return romaji + '.';
    }
  }

  if (japanese.includes('、') && japanese.includes('。')) {
    // Both comma and period
    const totalChars = japanese.replace(/[、。！？]/g, '').length;
    const commaPos = japanese.indexOf('、');
    const periodPos = japanese.indexOf('。');

    const beforeCommaChars = japanese.substring(0, commaPos).length;
    const beforePeriodChars = japanese.substring(0, periodPos).replace(/[、。！？]/g, '').length;

    const commaRatio = beforeCommaChars / totalChars;
    const periodRatio = beforePeriodChars / totalChars;

    const commaInsertPos = Math.round(romaji.length * commaRatio);
    let result = romaji.slice(0, commaInsertPos) + ',' + romaji.slice(commaInsertPos);

    // Adjust period position since we added a comma
    const periodInsertPos = Math.round((romaji.length + 1) * periodRatio);
    result = result.slice(0, periodInsertPos) + '.' + result.slice(periodInsertPos);

    return result;
  }

  return romaji;
}

// Read CSV
const csvContent = fs.readFileSync('./usutaku_DB_final.csv', 'utf-8');
const lines = csvContent.split('\n');

console.log('Adding punctuation to romaji (improved method)...\n');

let fixed = 0;
const results = [];

const updatedLines = lines.map((line, index) => {
  const trimmedLine = line.trim();
  if (!trimmedLine) return line;

  // Split only on the first comma to separate Japanese from romaji
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
    const fixedRomaji = insertPunctuationManual(japanese, firstPattern);
    fixed++;

    results.push({
      line: index + 1,
      japanese: japanese,
      before: firstPattern,
      after: fixedRomaji
    });

    if (fixed <= 15) {
      console.log('Line ' + (index + 1) + ': ' + japanese);
      console.log('  Before: ' + firstPattern);
      console.log('  After:  ' + fixedRomaji);
      console.log('');
    }

    return japanese + ',' + fixedRomaji;
  }

  return line;
});

fs.writeFileSync('./usutaku_DB_final_with_punct_v2.csv', updatedLines.join('\n'), 'utf-8');
console.log('Fixed ' + fixed + ' entries');
console.log('Output written to: usutaku_DB_final_with_punct_v2.csv');

// Write a detailed log
fs.writeFileSync('./punctuation_fixes.log', JSON.stringify(results, null, 2), 'utf-8');
console.log('Detailed log written to: punctuation_fixes.log');
