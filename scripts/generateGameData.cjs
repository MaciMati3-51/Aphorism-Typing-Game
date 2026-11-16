/**
 * ゲームデータ生成スクリプト
 *
 * 1. hiragana_romaji_master.csv → src/data/romajiMaster.js
 * 2. sentences_with_hiragana.csv → src/data/usutakuData.js
 *    各文は { id, original, kana }。kana は読み（打鍵対象の文字列）。
 *
 * ローマ字の打ち方（si/shi、「ん」「っ」の規則など）はここでは展開しない。
 * 実行時に src/utils/typingEngine.js が読みから全パターンを組み立てる。
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const HIRAGANA_MASTER_CSV = path.join(ROOT_DIR, 'hiragana_romaji_master.csv');
const SENTENCES_CSV = path.join(ROOT_DIR, 'sentences_with_hiragana.csv');
const ROMAJI_MASTER_OUTPUT = path.join(ROOT_DIR, 'src/data/romajiMaster.js');
const USUTAKU_DATA_OUTPUT = path.join(ROOT_DIR, 'src/data/usutakuData.js');

/**
 * CSVを簡易パース（ダブルクォート対応）
 */
function parseCSV(content) {
    const lines = content.split('\n');
    const result = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const row = [];
        let current = '';
        let inQuotes = false;

        for (let j = 0; j < line.length; j++) {
            const char = line[j];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                row.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        row.push(current);
        result.push(row);
    }

    return result;
}

/**
 * hiragana_romaji_master.csv を読み込んでマスターテーブルを生成
 */
function generateRomajiMaster() {
    console.log('Generating romaji master table...');

    const content = fs.readFileSync(HIRAGANA_MASTER_CSV, 'utf-8');
    const rows = parseCSV(content);

    const master = {};

    // ヘッダーをスキップ
    for (let i = 1; i < rows.length; i++) {
        const [hiragana, romajiPatterns, count, note] = rows[i];

        if (!hiragana || !romajiPatterns) continue;

        const patterns = romajiPatterns.split('|').map(p => p.trim()).filter(p => p);

        master[hiragana] = {
            patterns,
            count: parseInt(count) || patterns.length,
            note: note || ''
        };
    }

    // JavaScript ファイルとして出力
    const output = `// Auto-generated from hiragana_romaji_master.csv
// Do not edit manually

export const ROMAJI_MASTER = ${JSON.stringify(master, null, 2)};
`;

    fs.writeFileSync(ROMAJI_MASTER_OUTPUT, output, 'utf-8');
    console.log(`  -> Generated: ${ROMAJI_MASTER_OUTPUT}`);
    console.log(`  -> ${Object.keys(master).length} entries`);

    return master;
}

/**
 * sentences_with_hiragana.csv を読み込んでゲームデータを生成
 */
async function generateGameData() {
    console.log('Generating game data...');

    // 判定エンジンで「全文字が打てるか」を検証する（ESM なので動的 import）
    const { createSession, typeKey, getView } = await import('../src/utils/typingEngine.js');

    const content = fs.readFileSync(SENTENCES_CSV, 'utf-8');
    const rows = parseCSV(content);

    const aphorisms = [];
    const trailingPunctuation = ['.', '。', '、', ',', '，'];
    let warnings = 0;

    // ヘッダーをスキップ
    for (let i = 1; i < rows.length; i++) {
        const [originalText, , hiraganaTokens] = rows[i];

        if (!originalText || !hiraganaTokens) continue;

        // 末尾の区切り記号を削除
        const cleanedOriginal = originalText.replace(/[.。、,，]$/, '').trim();

        // トークンを分割（空白は打鍵対象にしない）
        const tokens = hiraganaTokens.split('|').map(t => t.trim()).filter(t => t);

        // 末尾トークンが区切り記号の場合は削除
        while (tokens.length > 0 && trailingPunctuation.includes(tokens[tokens.length - 1])) {
            tokens.pop();
        }

        const kana = tokens.join('');

        // 検証1: 打てない文字（漢字の混入など）が無いか
        const session = createSession(kana);
        const typable = getView(session).chars.join('');
        const expected = Array.from(kana.normalize('NFKC')).length;
        if (Array.from(typable.normalize('NFKC')).length !== expected) {
            warnings++;
            console.warn(`  [WARN] row ${i + 1}: 打てない文字を含む → 実行時は読み飛ばす: ${kana}`);
        }

        // 検証2: ガイド通りに打って完走できるか
        let state = session;
        for (const key of getView(session).remaining) {
            state = state && typeKey(state, key);
        }
        if (!state || !state.done) {
            warnings++;
            console.warn(`  [WARN] row ${i + 1}: ガイド通りに打っても完走できない: ${kana}`);
        }

        if (session.done) {
            console.warn(`  [WARN] row ${i + 1}: 打てる文字が無いので除外: ${originalText}`);
            continue;
        }

        aphorisms.push({
            id: i,
            original: cleanedOriginal,
            kana
        });
    }

    // JavaScript ファイルとして出力
    const output = `// Auto-generated from sentences_with_hiragana.csv
// Do not edit manually

export const APHORISMS = ${JSON.stringify(aphorisms, null, 2)};
`;

    fs.writeFileSync(USUTAKU_DATA_OUTPUT, output, 'utf-8');
    console.log(`  -> Generated: ${USUTAKU_DATA_OUTPUT}`);
    console.log(`  -> ${aphorisms.length} sentences, ${warnings} warnings`);

    return aphorisms;
}

// メイン処理
async function main() {
    console.log('=== Game Data Generator ===\n');

    // ローマ字マスターテーブルを生成（エンジンがこれを読むので先に作る）
    generateRomajiMaster();

    console.log('');

    // ゲームデータを生成
    await generateGameData();

    console.log('\n=== Done ===');
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
