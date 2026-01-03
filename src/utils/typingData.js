import { normalizeRomajiCandidates, splitRomajiCandidates } from './romaji';

const DEFAULT_HEADER_KEYS = {
    japanese: ['日本語文', '日本語', 'prompt_ja', 'original', 'text', 'prompt'],
    romaji: ['正解ローマ字', 'ローマ字', 'expected_romaji', 'romaji', 'expected']
};

const stripBom = (value) => {
    if (typeof value !== 'string') return value;
    return value.replace(/^\uFEFF/, '');
};

const normalizeHeader = (value) => String(value || '').trim().toLowerCase();

const findHeaderIndex = (headers, candidates) => {
    const normalizedCandidates = candidates.map((candidate) => normalizeHeader(candidate));
    for (let i = 0; i < headers.length; i += 1) {
        const normalizedHeader = normalizeHeader(headers[i]);
        if (normalizedCandidates.includes(normalizedHeader)) {
            return i;
        }
    }
    return -1;
};

const parseCsv = (text) => {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i += 1) {
        const char = text[i];

        if (inQuotes) {
            if (char === '"') {
                if (text[i + 1] === '"') {
                    field += '"';
                    i += 1;
                } else {
                    inQuotes = false;
                }
            } else {
                field += char;
            }
            continue;
        }

        if (char === '"') {
            inQuotes = true;
            continue;
        }

        if (char === ',') {
            row.push(field);
            field = '';
            continue;
        }

        if (char === '\n') {
            row.push(field);
            rows.push(row);
            row = [];
            field = '';
            continue;
        }

        if (char === '\r') {
            if (text[i + 1] === '\n') {
                i += 1;
            }
            row.push(field);
            rows.push(row);
            row = [];
            field = '';
            continue;
        }

        field += char;
    }

    if (field.length > 0 || row.length > 0) {
        row.push(field);
        rows.push(row);
    }

    return rows;
};

export const parseTypingCsv = (csvText, options = {}) => {
    const headerKeys = {
        japanese: options.japaneseHeaders || DEFAULT_HEADER_KEYS.japanese,
        romaji: options.romajiHeaders || DEFAULT_HEADER_KEYS.romaji
    };

    const rows = parseCsv(csvText);
    if (rows.length === 0) return [];

    const headerRow = rows[0].map((cell) => stripBom(cell ?? ''));
    const japaneseIndex = findHeaderIndex(headerRow, headerKeys.japanese);
    const romajiIndex = findHeaderIndex(headerRow, headerKeys.romaji);
    const hasHeader = japaneseIndex !== -1 || romajiIndex !== -1;

    const resolvedJapaneseIndex = japaneseIndex !== -1 ? japaneseIndex : 0;
    const resolvedRomajiIndex = romajiIndex !== -1 ? romajiIndex : 1;
    const startIndex = hasHeader ? 1 : 0;

    const entries = [];
    for (let i = startIndex; i < rows.length; i += 1) {
        const row = rows[i];
        if (!row || row.every((cell) => String(cell || '').trim() === '')) continue;

        const rawJapanese = stripBom(row[resolvedJapaneseIndex] ?? '').trim();
        let rawRomaji = '';

        if (!hasHeader) {
            rawRomaji = row.length > 1 ? row.slice(1).join(',') : row[1] ?? '';
        } else if (resolvedRomajiIndex === headerRow.length - 1 && row.length > resolvedRomajiIndex + 1) {
            rawRomaji = row.slice(resolvedRomajiIndex).join(',');
        } else {
            rawRomaji = row[resolvedRomajiIndex] ?? '';
        }

        rawRomaji = stripBom(String(rawRomaji));
        if (!rawJapanese || !rawRomaji) continue;

        const normalizedCandidates = normalizeRomajiCandidates(rawRomaji);
        if (normalizedCandidates.length === 0) continue;

        entries.push({
            id: entries.length + 1,
            original: rawJapanese,
            expectedRaw: rawRomaji,
            expectedCandidatesRaw: splitRomajiCandidates(rawRomaji),
            expectedCandidatesNormalized: normalizedCandidates,
            displayRomaji: normalizedCandidates[0],
            tokens: [normalizedCandidates[0]]
        });
    }

    return entries;
};

export const loadTypingData = async (url, options = {}) => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to load typing data: ${response.status}`);
    }
    const text = await response.text();
    return parseTypingCsv(text, options);
};
