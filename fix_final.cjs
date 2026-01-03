const fs = require('fs');

// Generate all romaji variants including ha/wa
function generateAllVariants(romaji) {
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
    { from: 'ha', to: 'wa' }, // IMPORTANT: Always convert ha <-> wa
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

// Manual punctuation fixes for key entries
const manualFixes = {
  '生成AIとは、洗濯機である': 'seiseiAItowa,sentakukidearu',
  '当たり前の基準が、全て。': 'atarimaenoukijunga,subete.',
  '悩むとは、問題を複雑にしていること。': 'nayamutowa,monndaiwofukuzatunishiteirukoto.',
  '悩むのではなく、考える。問題を解決にする。': 'nayamunodenakukangaeru.monndaiwokaiketunisuru.',
  '自ら機会を作り出し、機会によって自らを変えよ': 'mizukarakikaiwotukuridashi,kikainiyottemizukarawokaeyyo',
  '他人をリスペクトできない人が嫌いだ。': 'taninworisupekyutodekinaihihogakiraida.',
  '相手を少しでも配慮していればそんな発言をしないだろう、と思うことが普段何度もある。': 'aitewosukoshidemohairioshiteirebasonnnahatugenwoshinaidarou,toomoukotogafudannandomoaru.',
  'でも、遅れるなら謝罪＋連絡は当たり前だとusutakuは思う。': 'demo,okurerunarasjazaipurennrakuwaatarimaedatousutakuwaomou.',
  '遠慮しないことを、他人にリスペクトを持たないことと勘違いしている人の多さだ。': 'enryoshinaikotowo,taniinirisupekyuomotanaikototokanchigaishiteiruhitononooosada.',
  '卑下と謙遜は違う！': 'higentokansonwachigau!',
  '悩むのをやめる。': 'nayamuwoyameru.',
  'バレーって常に前傾姿勢なのがコツだな。ビジネスと同じや。': 'bare-ttetunenizenkeisiseinanogakotudanabizinesutonaziya.',
  '例えば「最近忙しい？」とだけ送られても困る。': 'tatoebasaikinisogashii?todakeokuraretekoumaru.',
};

// Read CSV
const csvContent = fs.readFileSync('./usutaku_DB_final.csv', 'utf-8');
const lines = csvContent.split('\n');

console.log('=== Final Comprehensive Fix ===\n');
console.log('1. Applying manual punctuation fixes');
console.log('2. Generating all ha/wa variants');
console.log('3. Generating all shi/si, chi/ti, etc. variants\n');

let manualFixed = 0;
let variantsGenerated = 0;

const updatedLines = lines.map((line, index) => {
  const trimmedLine = line.trim();
  if (!trimmedLine) return line;

  const firstCommaIndex = trimmedLine.indexOf(',');
  if (firstCommaIndex === -1) return line;

  const japanese = trimmedLine.substring(0, firstCommaIndex);
  const romajiPart = trimmedLine.substring(firstCommaIndex + 1);
  const currentPatterns = romajiPart.split('|').map(p => p.trim());

  let basePattern = currentPatterns[0];

  // Apply manual fixes if available
  if (manualFixes[japanese]) {
    basePattern = manualFixes[japanese];
    manualFixed++;
    console.log('Manual fix line ' + (index + 1) + ': ' + japanese.substring(0, 40));
  }

  // Generate variants from ALL existing patterns, not just the first one
  const allVariantsSet = new Set();
  currentPatterns.forEach(pattern => {
    const variants = generateAllVariants(pattern);
    variants.forEach(v => allVariantsSet.add(v));
  });

  // Also generate from base pattern (manual fix or first pattern)
  const baseVariants = generateAllVariants(basePattern);
  baseVariants.forEach(v => allVariantsSet.add(v));

  const allVariants = Array.from(allVariantsSet).sort();
  variantsGenerated++;

  return japanese + ',' + allVariants.join('|');
});

fs.writeFileSync('./usutaku_DB_final.csv', updatedLines.join('\n'), 'utf-8');

console.log('\n=== Summary ===');
console.log('Manual fixes applied: ' + manualFixed);
console.log('Total entries with variants generated: ' + variantsGenerated);
console.log('Output written to: usutaku_DB_final.csv');
console.log('\nDone!');
