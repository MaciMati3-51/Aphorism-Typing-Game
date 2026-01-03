const fs = require('fs');

// Add punctuation to romaji string based on Japanese text
function addPunctuation(japanese, romaji) {
  let result = romaji;
  let romajiPos = 0;

  for (let i = 0; i < japanese.length; i++) {
    const char = japanese[i];

    if (char === '、') {
      // Insert comma at current position
      result = result.slice(0, romajiPos) + ',' + result.slice(romajiPos);
      romajiPos++; // Move past the comma
    } else if (char === '。') {
      // Insert period
      result = result.slice(0, romajiPos) + '.' + result.slice(romajiPos);
      romajiPos++;
    } else if (char === '！') {
      result = result.slice(0, romajiPos) + '!' + result.slice(romajiPos);
      romajiPos++;
    } else if (char === '？') {
      result = result.slice(0, romajiPos) + '?' + result.slice(romajiPos);
      romajiPos++;
    } else {
      // For regular characters, move forward in romaji
      // This is approximate - just move 1-4 chars forward
      // Hiragana/Katakana: usually 1-3 romaji chars
      // Kanji: varies widely
      if (char.match(/[\u3040-\u309F\u30A0-\u30FF]/)) {
        // Hiragana or Katakana
        romajiPos += 2; // Average
      } else if (char.match(/[\u4E00-\u9FAF]/)) {
        // Kanji
        romajiPos += 3; // Average
      } else {
        // ASCII or other
        romajiPos += 1;
      }
    }
  }

  return result;
}

// Better approach: insert punctuation based on pattern matching
function addPunctuationSimple(japanese, romaji) {
  let result = romaji;

  // Count how many Japanese punctuation marks exist
  const commas = (japanese.match(/、/g) || []).length;
  const periods = (japanese.match(/。/g) || []).length;
  const exclamations = (japanese.match(/！/g) || []).length;
  const questions = (japanese.match(/？/g) || []).length;

  // If there are punctuation marks in Japanese but not in romaji, we need to add them
  if (commas > 0 && !result.includes(',')) {
    // Find logical positions to insert commas
    // This is a heuristic approach
    const parts = japanese.split('、');
    let currentPos = 0;
    let newResult = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      // Estimate romaji length for this part
      // Average: 2.5 chars per Japanese char
      const estimatedLength = Math.floor(part.length * 2.5);
      const segment = result.slice(currentPos, currentPos + estimatedLength);

      newResult += segment;
      if (i < parts.length - 1) {
        newResult += ',';
      }
      currentPos += estimatedLength;
    }
    // Add any remaining characters
    newResult += result.slice(currentPos);
    result = newResult;
  }

  // Handle periods
  if (periods > 0 && !result.includes('.')) {
    const parts = japanese.split('。');
    if (parts.length === 2 && parts[1].trim() === '') {
      // Period at the end
      result = result + '.';
    }
  }

  return result;
}

// Generate all romaji variants
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
    { from: 'ha', to: 'wa' },  // Add ha/wa conversion
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

// Read CSV
const csvContent = fs.readFileSync('./usutaku_DB_final.csv', 'utf-8');
const lines = csvContent.split('\n');

console.log('Processing CSV with comprehensive fixes...\n');

const updatedLines = lines.map((line, index) => {
  const trimmedLine = line.trim();
  if (!trimmedLine) return line;

  const parts = trimmedLine.split(',');
  if (parts.length < 2) return line;

  const japanese = parts[0];
  const currentPatterns = parts[1].split('|').map(p => p.trim());
  const firstPattern = currentPatterns[0];

  // Step 1: Add punctuation if missing
  let basePattern = firstPattern;
  const hasPunctInJapanese = japanese.match(/[、。！？]/);
  const hasPunctInRomaji = firstPattern.match(/[,\.!?]/);

  if (hasPunctInJapanese && !hasPunctInRomaji) {
    basePattern = addPunctuationSimple(japanese, firstPattern);
    console.log('Line ' + (index + 1) + ': Added punctuation');
    console.log('  Japanese: ' + japanese.substring(0, 40));
    console.log('  Before: ' + firstPattern.substring(0, 50));
    console.log('  After: ' + basePattern.substring(0, 50));
  }

  // Step 2: Generate all variants
  const allVariants = generateRomajiVariants(basePattern);

  return japanese + ',' + allVariants.join('|');
});

fs.writeFileSync('./usutaku_DB_final.csv', updatedLines.join('\n'), 'utf-8');
console.log('\nCSV updated successfully!');
console.log('Total lines processed: ' + lines.length);
