const {APHORISMS} = require('./src/data/usutakuData.js');

console.log('=== Comprehensive Romaji Variant Check ===\n');

const tests = [
  { pattern: 'shi', alt: 'si', desc: 'し (shi/si)' },
  { pattern: 'chi', alt: 'ti', desc: 'ち (chi/ti)' },
  { pattern: 'tsu', alt: 'tu', desc: 'つ (tsu/tu)' },
  { pattern: 'chu', alt: 'tyu', desc: 'ちゅ (chu/tyu)' },
  { pattern: 'shu', alt: 'syu', desc: 'しゅ (shu/syu)' },
  { pattern: 'fu', alt: 'hu', desc: 'ふ (fu/hu)' },
  { pattern: 'ji', alt: 'zi', desc: 'じ (ji/zi)' },
  { pattern: 'sha', alt: 'sya', desc: 'しゃ (sha/sya)' },
  { pattern: 'cho', alt: 'tyo', desc: 'ちょ (cho/tyo)' }
];

let allOk = true;

tests.forEach(test => {
  const entries = APHORISMS.filter(a =>
    a.tokens.some(t => t.includes(test.pattern))
  );

  if (entries.length > 0) {
    const firstEntry = entries[0];
    const hasPattern = firstEntry.tokens.some(t => t.includes(test.pattern));
    const hasAlt = firstEntry.tokens.some(t => t.includes(test.alt));

    console.log(test.desc + ':');
    console.log('  Sample: "' + firstEntry.original.substring(0, 30) + '..."');
    console.log('  Has ' + test.pattern + '? ' + hasPattern);
    console.log('  Has ' + test.alt + '? ' + hasAlt);
    console.log('  Status: ' + (hasPattern && hasAlt ? '✓ OK' : '✗ MISSING'));

    if (!hasAlt) {
      console.log('  Tokens:', firstEntry.tokens.slice(0, 3));
      allOk = false;
    }
    console.log('');
  }
});

console.log('\n=== Summary ===');
console.log(allOk ? 'All variants are present! ✓' : 'Some variants are missing! ✗');
