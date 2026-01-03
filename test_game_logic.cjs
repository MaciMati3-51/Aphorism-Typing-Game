const {APHORISMS} = require('./src/data/usutakuData.js');

// Import romaji utilities (simulating them)
const normalizeRomaji = (value) => {
  if (value == null) return '';
  return String(value).normalize('NFKC').toLowerCase().replace(/\s+/g, '');
};

const splitRomajiCandidates = (raw) => {
  if (raw == null) return [];
  return String(raw).split('|').map(c => c.trim()).filter(c => c.length > 0);
};

const normalizeRomajiCandidates = (raw) => {
  const seen = new Set();
  const normalized = [];
  for (const candidate of splitRomajiCandidates(raw)) {
    const normalizedCandidate = normalizeRomaji(candidate);
    if (!normalizedCandidate || seen.has(normalizedCandidate)) continue;
    seen.add(normalizedCandidate);
    normalized.push(normalizedCandidate);
  }
  return normalized;
};

// Test convertAphorismsToGameData
const convertAphorismsToGameData = (aphorisms) => {
  return aphorisms.map((item) => {
    const tokensString = item.tokens.join('|');
    const normalizedCandidates = normalizeRomajiCandidates(tokensString);

    return {
      id: item.id,
      original: item.original,
      expectedRaw: tokensString,
      expectedCandidatesRaw: item.tokens,
      expectedCandidatesNormalized: normalizedCandidates,
      displayRomaji: normalizedCandidates[0],
      tokens: normalizedCandidates
    };
  });
};

console.log('=== Testing Game Logic Conversion ===\n');

const gameData = convertAphorismsToGameData(APHORISMS);

// Test chu/tyu entry
const chuEntry = gameData.find(e => e.original.includes('ドーパミン中毒'));
console.log('Test 1: ドーパミン中毒');
console.log('  Original tokens count:', APHORISMS.find(a => a.id === chuEntry.id).tokens.length);
console.log('  Normalized tokens count:', chuEntry.expectedCandidatesNormalized.length);
console.log('  Has chu?', chuEntry.expectedCandidatesNormalized.some(t => t.includes('chu')));
console.log('  Has tyu?', chuEntry.expectedCandidatesNormalized.some(t => t.includes('tyu')));
console.log('  First 3 normalized:', chuEntry.expectedCandidatesNormalized.slice(0, 3));
console.log('');

// Test shi/si entry
const shiEntry = gameData.find(e => e.original.includes('セル結合'));
console.log('Test 2: セル結合するな');
console.log('  Original tokens count:', APHORISMS.find(a => a.id === shiEntry.id).tokens.length);
console.log('  Normalized tokens count:', shiEntry.expectedCandidatesNormalized.length);
console.log('  Has shi?', shiEntry.expectedCandidatesNormalized.some(t => t.includes('tsu')));
console.log('  Has si?', shiEntry.expectedCandidatesNormalized.some(t => t.includes('tu')));
console.log('  All normalized:', shiEntry.expectedCandidatesNormalized);
