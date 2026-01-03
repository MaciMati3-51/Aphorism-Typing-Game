const PUNCTUATION_MAP = {
    '、': ',',
    '。': '.',
    '，': ',',
    '．': '.',
    '！': '!',
    '？': '?',
    '「': '"',
    '」': '"',
    '『': '"',
    '』': '"',
    '（': '(',
    '）': ')',
    '［': '[',
    '］': ']',
    '｛': '{',
    '｝': '}',
    '・': '.',
    'ー': '-',
    '―': '-',
    '‐': '-',
    '－': '-',
    '〜': '~',
    '～': '~'
};

const normalizePunctuation = (value) => {
    let result = '';
    for (const char of value) {
        result += PUNCTUATION_MAP[char] ?? char;
    }
    return result;
};

export const normalizeRomaji = (value) => {
    if (value == null) return '';
    const normalized = String(value).normalize('NFKC');
    return normalizePunctuation(normalized)
        .toLowerCase()
        .replace(/\s+/g, '');
};

export const splitRomajiCandidates = (raw) => {
    if (raw == null) return [];
    return String(raw)
        .split('|')
        .map((candidate) => candidate.trim())
        .filter((candidate) => candidate.length > 0);
};

export const normalizeRomajiCandidates = (raw) => {
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

const commonPrefixLength = (a, b) => {
    const minLength = Math.min(a.length, b.length);
    let index = 0;
    while (index < minLength && a[index] === b[index]) {
        index += 1;
    }
    return index;
};

export const matchRomajiInput = (expectedCandidates, typedRaw) => {
    const normalizedTyped = normalizeRomaji(typedRaw);
    if (!Array.isArray(expectedCandidates) || expectedCandidates.length === 0) {
        return {
            isValid: false,
            isComplete: false,
            normalizedTyped,
            matchedCandidate: '',
            matchedLength: 0,
            ngIndex: 0
        };
    }

    let bestCandidate = expectedCandidates[0];
    let bestPrefixLength = 0;
    let matchedCandidate = '';
    let isValid = false;
    let isComplete = false;

    for (const candidate of expectedCandidates) {
        const prefixLength = commonPrefixLength(candidate, normalizedTyped);
        if (prefixLength > bestPrefixLength) {
            bestPrefixLength = prefixLength;
            bestCandidate = candidate;
        }

        if (!isValid && candidate.startsWith(normalizedTyped)) {
            matchedCandidate = candidate;
            isValid = true;
        }
        if (candidate === normalizedTyped) {
            isComplete = true;
        }
    }

    if (!isValid) {
        return {
            isValid: false,
            isComplete: false,
            normalizedTyped,
            matchedCandidate: bestCandidate,
            matchedLength: bestPrefixLength,
            ngIndex: bestPrefixLength
        };
    }

    return {
        isValid: true,
        isComplete,
        normalizedTyped,
        matchedCandidate,
        matchedLength: normalizedTyped.length,
        ngIndex: null
    };
};
