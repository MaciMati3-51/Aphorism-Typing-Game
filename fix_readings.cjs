const fs = require('fs');
const path = require('path');

const KuroshiroMod = require('kuroshiro');
const KuromojiMod = require('kuroshiro-analyzer-kuromoji');

const Kuroshiro = KuroshiroMod.default || KuroshiroMod;
const KuromojiAnalyzer = KuromojiMod.default || KuromojiMod;

const dictPath = path.resolve('node_modules/kuromoji/dict').replace(/\\/g, '/');

const readingOverrides = [
  ['前傾姿勢', 'ぜんけいしせい'],
  ['他責', 'たせき'],
  ['負の感情', 'ふのかんじょう'],
  ['正しく', 'ただしく'],
  ['漏洩', 'ろうえい'],
  ['人は', 'ひとは']
];

const variantPatterns = [
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
  { from: 'fa', to: 'hwa' },
  { from: 'fi', to: 'hwi' },
  { from: 'fe', to: 'hwe' },
  { from: 'fo', to: 'hwo' },
  { from: 'ji', to: 'zi' },
  { from: 'ja', to: 'zya' },
  { from: 'ju', to: 'zyu' },
  { from: 'jo', to: 'zyo' }
];

const applyOverrides = (text) => {
  let result = text;
  for (const [from, to] of readingOverrides) {
    result = result.split(from).join(to);
  }
  return result;
};

const normalizeRomajiToken = (token) => {
  return token
    .normalize('NFKC')
    .replace(/[āâ]/g, 'aa')
    .replace(/[īî]/g, 'ii')
    .replace(/[ūû]/g, 'uu')
    .replace(/[ēê]/g, 'ee')
    .replace(/[ōô]/g, 'ou')
    .replace(/[’']/g, '')
    .replace(/m(?=[bmp])/g, 'n')
    .toLowerCase();
};

const isAsciiToken = (token) => /[A-Za-z0-9]/.test(token);

const generateVariantsForToken = (token) => {
  const variants = new Set();

  const generateCombinations = (str, patternIndex) => {
    if (patternIndex >= variantPatterns.length) {
      variants.add(str);
      return;
    }

    const pattern = variantPatterns[patternIndex];
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
  };

  generateCombinations(token, 0);
  return Array.from(variants);
};

const combineTokenVariants = (variantsByToken) => {
  let combined = [''];
  for (const tokenVariants of variantsByToken) {
    const next = new Set();
    for (const prefix of combined) {
      for (const variant of tokenVariants) {
        next.add(prefix + variant);
      }
    }
    combined = Array.from(next);
  }
  return combined;
};

const buildVariantsForLine = async (kuroshiro, japanese) => {
  const preprocessed = applyOverrides(japanese);
  const hiraSpaced = await kuroshiro.convert(preprocessed, { to: 'hiragana', mode: 'spaced' });
  const romajiSpaced = await kuroshiro.convert(preprocessed, { to: 'romaji', mode: 'spaced', romajiSystem: 'hepburn' });

  const hiraTokens = hiraSpaced.trim().split(/\s+/).filter(Boolean);
  const romajiTokens = romajiSpaced.trim().split(/\s+/).filter(Boolean);

  if (hiraTokens.length !== romajiTokens.length) {
    const fallbackBase = normalizeRomajiToken(romajiSpaced.replace(/\s+/g, ''));
    const fallbackVariants = generateVariantsForToken(fallbackBase);
    const uniqFallback = new Set(fallbackVariants);
    uniqFallback.add(fallbackBase);
    const sortedFallback = Array.from(uniqFallback).sort();
    const orderedFallback = sortedFallback.filter((value) => value !== fallbackBase);
    return [fallbackBase, ...orderedFallback];
  }

  const variantsByToken = [];
  const baseTokens = [];

  for (let i = 0; i < hiraTokens.length; i += 1) {
    const hiraToken = hiraTokens[i];
    const rawBaseToken = normalizeRomajiToken(romajiTokens[i]);

    if (hiraToken === 'は') {
      variantsByToken.push(['wa', 'ha']);
      baseTokens.push('wa');
      continue;
    }
    if (hiraToken === 'へ') {
      variantsByToken.push(['e', 'he']);
      baseTokens.push('e');
      continue;
    }
    if (hiraToken === 'を') {
      variantsByToken.push(['o', 'wo']);
      baseTokens.push('o');
      continue;
    }

    if (isAsciiToken(hiraToken)) {
      variantsByToken.push([rawBaseToken]);
      baseTokens.push(rawBaseToken);
      continue;
    }

    if (/^[,\.!?\"()=+\-･]+$/.test(rawBaseToken)) {
      variantsByToken.push([rawBaseToken]);
      baseTokens.push(rawBaseToken);
      continue;
    }

    const tokenVariants = generateVariantsForToken(rawBaseToken);
    variantsByToken.push(tokenVariants);
    baseTokens.push(rawBaseToken);
  }

  const baseRomaji = baseTokens.join('');
  const combinedVariants = combineTokenVariants(variantsByToken);
  const uniqueVariants = new Set(combinedVariants);
  uniqueVariants.add(baseRomaji);

  const sortedVariants = Array.from(uniqueVariants).sort();
  const orderedVariants = sortedVariants.filter((value) => value !== baseRomaji);
  return [baseRomaji, ...orderedVariants];
};

const run = async () => {
  const kuroshiro = new Kuroshiro();
  const analyzer = new KuromojiAnalyzer({ dictPath });
  await kuroshiro.init(analyzer);

  const csvContent = fs.readFileSync('./usutaku_DB_final.csv', 'utf8');
  const lines = csvContent.split(/\r?\n/).filter((line) => line.trim().length > 0);

  const updatedLines = [];
  for (const line of lines) {
    const commaIndex = line.indexOf(',');
    if (commaIndex === -1) {
      updatedLines.push(line);
      continue;
    }

    const japanese = line.slice(0, commaIndex);
    const variants = await buildVariantsForLine(kuroshiro, japanese);
    updatedLines.push(`${japanese},${variants.join('|')}`);
  }

  fs.writeFileSync('./usutaku_DB_final.csv', updatedLines.join('\n'), 'utf8');
  console.log(`Updated ${updatedLines.length} lines in usutaku_DB_final.csv`);
};

run().catch((error) => {
  console.error('Failed to regenerate romaji variants:', error);
  process.exit(1);
});
