/**
 * ゲームデータ生成スクリプト
 *
 * 1. hiragana_romaji_master.csv → src/data/romajiMaster.js
 * 2. sentences_with_hiragana.csv → src/data/usutakuData.js (新形式)
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const HIRAGANA_MASTER_CSV = path.join(ROOT_DIR, 'hiragana_romaji_master.csv');
const SENTENCES_CSV = path.join(ROOT_DIR, 'sentences_with_hiragana.csv');
const ROMAJI_MASTER_OUTPUT = path.join(ROOT_DIR, 'src/data/romajiMaster.js');
const USUTAKU_DATA_OUTPUT = path.join(ROOT_DIR, 'src/data/usutakuData.js');

// 拗音のリスト（2文字セットとして扱う）
const YOUON_CHARS = ['ゃ', 'ゅ', 'ょ', 'ぁ', 'ぃ', 'ぅ', 'ぇ', 'ぉ', 'ャ', 'ュ', 'ョ', 'ァ', 'ィ', 'ゥ', 'ェ', 'ォ'];

// 「ん」の後にこれらで始まるローマ字が来る場合、nn必須
const N_REQUIRES_DOUBLE = ['a', 'i', 'u', 'e', 'o', 'y', 'n'];

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

// 「ん」の後にこれらで始まるローマ字が来る場合、nn必須
export const N_REQUIRES_DOUBLE = ${JSON.stringify(N_REQUIRES_DOUBLE)};

/**
 * 文字に対応するローマ字パターンを取得
 * @param {string} char - ひらがな/カタカナ/記号
 * @returns {string[]} ローマ字パターンの配列
 */
export function getRomajiPatterns(char) {
    const entry = ROMAJI_MASTER[char];
    if (entry) {
        return entry.patterns;
    }

    // 英数字はそのまま返す
    if (/^[a-zA-Z0-9]$/.test(char)) {
        return [char.toLowerCase()];
    }

    // 未知の文字は空配列
    return [];
}
`;

    fs.writeFileSync(ROMAJI_MASTER_OUTPUT, output, 'utf-8');
    console.log(`  -> Generated: ${ROMAJI_MASTER_OUTPUT}`);
    console.log(`  -> ${Object.keys(master).length} entries`);

    return master;
}

/**
 * 拗音を考慮してトークンをマージ
 * 例: ["き", "ゃ"] → ["きゃ"]
 */
function mergeYouonTokens(tokens, master) {
    const result = [];

    for (let i = 0; i < tokens.length; i++) {
        const current = tokens[i];
        const next = tokens[i + 1];

        // 次のトークンが拗音文字の場合、結合
        if (next && YOUON_CHARS.includes(next)) {
            const combined = current + next;

            // マスターに結合形があるか確認
            if (master[combined]) {
                result.push(combined);
                i++; // 次のトークンをスキップ
                continue;
            }
        }

        result.push(current);
    }

    return result;
}

/**
 * 促音「っ」の処理
 * 次の文字の子音を重ねるパターンを生成
 */
function processSokuon(tokens, index, master) {
    const nextToken = tokens[index + 1];
    if (!nextToken) {
        // 次の文字がない場合は独立入力
        return master['っ']?.patterns || ['xtu', 'ltu'];
    }

    // 次の文字のローマ字パターンを取得
    const nextPatterns = master[nextToken]?.patterns || getRomajiPatternsForChar(nextToken, master);
    if (!nextPatterns || nextPatterns.length === 0) {
        return master['っ']?.patterns || ['xtu', 'ltu'];
    }

    // 各パターンの最初の子音を重ねる
    const sokuonPatterns = [];
    for (const pattern of nextPatterns) {
        if (pattern.length > 0 && /^[a-z]/.test(pattern)) {
            const consonant = pattern[0];
            // 母音で始まる場合は促音なし
            if (['a', 'i', 'u', 'e', 'o'].includes(consonant)) {
                continue;
            }
            sokuonPatterns.push(consonant + pattern);
        }
    }

    // 独立入力パターンも追加
    const independentPatterns = master['っ']?.patterns || ['xtu', 'ltu'];
    for (const indep of independentPatterns) {
        for (const next of nextPatterns) {
            sokuonPatterns.push(indep + next);
        }
    }

    return [...new Set(sokuonPatterns)];
}

/**
 * 文字に対するローマ字パターンを取得
 */
function getRomajiPatternsForChar(char, master) {
    const entry = master[char];
    if (entry) {
        return entry.patterns;
    }

    // 英数字はそのまま
    if (/^[a-zA-Z0-9]$/.test(char)) {
        return [char.toLowerCase()];
    }

    // 未知の文字
    return [char];
}

/**
 * 「ん」の処理
 * 次の文字によってnn必須かどうかを判定
 */
function processN(tokens, index, master) {
    const nextToken = tokens[index + 1];
    const basePatterns = master['ん']?.patterns || ['nn', "n'", 'xn'];

    if (!nextToken) {
        // 文末の「ん」は n でも OK
        return ['n', ...basePatterns];
    }

    // 次の文字のローマ字パターンを取得
    const nextPatterns = master[nextToken]?.patterns || getRomajiPatternsForChar(nextToken, master);
    if (!nextPatterns || nextPatterns.length === 0) {
        return ['n', ...basePatterns];
    }

    // 次の文字の最初のローマ字がa,i,u,e,o,y,nで始まるか確認
    const firstRomaji = nextPatterns[0];
    if (firstRomaji && N_REQUIRES_DOUBLE.includes(firstRomaji[0].toLowerCase())) {
        // nn必須
        return basePatterns;
    } else {
        // n でも OK
        return ['n', ...basePatterns];
    }
}

/**
 * sentences_with_hiragana.csv を読み込んで新形式のゲームデータを生成
 */
function generateGameData(master) {
    console.log('Generating game data...');

    const content = fs.readFileSync(SENTENCES_CSV, 'utf-8');
    const rows = parseCSV(content);

    const aphorisms = [];
    const trailingPunctuation = ['.', '。', '、', ',', '，'];

    // ヘッダーをスキップ
    for (let i = 1; i < rows.length; i++) {
        const [originalText, hiragana, hiraganaTokens, originalPatterns] = rows[i];

        if (!originalText || !hiraganaTokens) continue;

        // 末尾の区切り記号を削除
        let cleanedOriginal = originalText.replace(/[.。、,，]$/, '').trim();

        // トークンを分割
        let tokens = hiraganaTokens.split('|').map(t => t.trim()).filter(t => t);

        // 末尾トークンが区切り記号の場合は削除
        while (tokens.length > 0 && trailingPunctuation.includes(tokens[tokens.length - 1])) {
            tokens.pop();
        }

        // 拗音をマージ
        tokens = mergeYouonTokens(tokens, master);

        // 各トークンにローマ字パターンを付与
        const characters = [];

        for (let j = 0; j < tokens.length; j++) {
            const token = tokens[j];
            let romaji;

            // 促音の処理
            if (token === 'っ' || token === 'ッ') {
                romaji = processSokuon(tokens, j, master);
                // 促音は次の文字と結合して処理するので、次の文字をスキップするかどうか
                // ここでは促音単体のパターンを使用し、次の文字は別で処理
                romaji = master['っ']?.patterns || ['xtu', 'ltu', 'xtsu', 'ltsu'];
            }
            // 「ん」の処理
            else if (token === 'ん' || token === 'ン') {
                romaji = processN(tokens, j, master);
            }
            // 通常の文字
            else {
                romaji = getRomajiPatternsForChar(token, master);
            }

            characters.push({
                char: token,
                romaji: romaji
            });
        }

        aphorisms.push({
            id: i,
            original: cleanedOriginal,
            characters: characters
        });
    }

    // JavaScript ファイルとして出力
    const output = `// Auto-generated from sentences_with_hiragana.csv
// Do not edit manually

export const APHORISMS = ${JSON.stringify(aphorisms, null, 2)};
`;

    fs.writeFileSync(USUTAKU_DATA_OUTPUT, output, 'utf-8');
    console.log(`  -> Generated: ${USUTAKU_DATA_OUTPUT}`);
    console.log(`  -> ${aphorisms.length} sentences`);

    return aphorisms;
}

// メイン処理
function main() {
    console.log('=== Game Data Generator ===\n');

    // ローマ字マスターテーブルを生成
    const master = generateRomajiMaster();

    console.log('');

    // ゲームデータを生成
    generateGameData(master);

    console.log('\n=== Done ===');
}

main();
