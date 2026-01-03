const fs = require('fs');

// Insert punctuation into romaji based on relative position in Japanese text
function insertPunctuation(japanese, romaji) {
  let result = '';
  let romajiIndex = 0;

  for (let i = 0; i < japanese.length; i++) {
    const char = japanese[i];

    // Skip Japanese punctuation in the source
    if (char === '、') {
      result += ',';
      continue;
    } else if (char === '。') {
      result += '.';
      continue;
    } else if (char === '！') {
      result += '!';
      continue;
    } else if (char === '？') {
      result += '?';
      continue;
    }

    // For regular characters, estimate how many romaji characters they correspond to
    let charsToTake = 0;

    if (char.match(/[\u3040-\u309F]/)) {
      // Hiragana
      if (char === 'っ') {
        // Small tsu - represents gemination, skip for now
        continue;
      } else if (['ゃ', 'ゅ', 'ょ'].includes(char)) {
        // Small ya, yu, yo - part of previous character
        charsToTake = 1;
      } else {
        // Regular hiragana - typically 2 romaji chars
        charsToTake = 2;
        // But check for long vowels and special cases
        if (['あ', 'い', 'う', 'え', 'お', 'を', 'ん'].includes(char)) {
          charsToTake = 1;
        }
      }
    } else if (char.match(/[\u30A0-\u30FF]/)) {
      // Katakana - similar to hiragana
      charsToTake = 2;
    } else if (char.match(/[\u4E00-\u9FAF]/)) {
      // Kanji - varies, use average
      charsToTake = 3;
    } else {
      // ASCII, numbers, etc. - usually 1:1
      charsToTake = 1;
    }

    // Take characters from romaji
    const segment = romaji.slice(romajiIndex, romajiIndex + charsToTake);
    result += segment;
    romajiIndex += charsToTake;
  }

  // Add any remaining romaji characters
  result += romaji.slice(romajiIndex);

  return result;
}

// Simpler approach: use relative position
function insertPunctuationRelative(japanese, romaji) {
  // Find all punctuation positions in Japanese
  const punctPositions = [];
  for (let i = 0; i < japanese.length; i++) {
    const char = japanese[i];
    if (char === '、' || char === '。' || char === '！' || char === '？') {
      punctPositions.push({ pos: i, char: char });
    }
  }

  if (punctPositions.length === 0) {
    return romaji;
  }

  // Calculate relative positions (excluding punctuation)
  const japaneseNoP = japanese.replace(/[、。！？]/g, '');
  const relativePositions = punctPositions.map(p => {
    const posNoPunct = japanese.substring(0, p.pos).replace(/[、。！？]/g, '').length;
    return {
      relativePos: posNoPunct / japaneseNoP.length,
      char: p.char
    };
  });

  // Insert punctuation at relative positions in romaji
  let result = romaji;
  let offset = 0;

  relativePositions.forEach(p => {
    const insertPos = Math.floor(result.length * p.relativePos) + offset;
    const punctChar = p.char === '、' ? ',' : p.char === '。' ? '.' : p.char === '！' ? '!' : '?';
    result = result.slice(0, insertPos) + punctChar + result.slice(insertPos);
    offset += 1;
  });

  return result;
}

// Read CSV
const csvContent = fs.readFileSync('./usutaku_DB_final.csv', 'utf-8');
const lines = csvContent.split('\n');

console.log('Adding punctuation to romaji...\n');

let fixed = 0;

const updatedLines = lines.map((line, index) => {
  const trimmedLine = line.trim();
  if (!trimmedLine) return line;

  const parts = trimmedLine.split(',');
  if (parts.length < 2) return line;

  const japanese = parts[0];
  const romajiPart = parts.slice(1).join(','); // Rejoin in case there were commas in romaji
  const currentPatterns = romajiPart.split('|').map(p => p.trim());
  const firstPattern = currentPatterns[0];

  // Check if Japanese has punctuation but romaji doesn't
  const japaneseHasPunct = japanese.match(/[、。！？]/);
  const romajiHasPunct = firstPattern.match(/[,\.!?]/);

  if (japaneseHasPunct && !romajiHasPunct) {
    const fixedRomaji = insertPunctuationRelative(japanese, firstPattern);
    fixed++;

    if (fixed <= 10) {
      console.log('Line ' + (index + 1) + ': ' + japanese.substring(0, 40));
      console.log('  Before: ' + firstPattern.substring(0, 50));
      console.log('  After:  ' + fixedRomaji.substring(0, 50));
      console.log('');
    }

    return japanese + ',' + fixedRomaji;
  }

  return line;
});

fs.writeFileSync('./usutaku_DB_final_with_punct.csv', updatedLines.join('\n'), 'utf-8');
console.log('Fixed ' + fixed + ' entries');
console.log('Output written to: usutaku_DB_final_with_punct.csv');
console.log('\nPlease review the output file and replace usutaku_DB_final.csv if it looks good.');
