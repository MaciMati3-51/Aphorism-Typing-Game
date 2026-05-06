import fs from 'fs';
import { KANA_TO_ROMAJI, KATAKANA_TO_ROMAJI } from './src/utils/kanaToRomaji.js';

// usutakuData.jsを読み込む
const fileContent = fs.readFileSync('./src/data/usutakuData.js', 'utf-8');
const jsonString = fileContent.replace('export const APHORISMS = ', '').replace(/;$/, '');
const aphorisms = JSON.parse(jsonString);

console.log(`Processing ${aphorisms.length} aphorisms...`);

// kanaからローマ字パターンを生成する関数
// MAX_PATTERNS: 最大パターン数の制限
const MAX_PATTERNS = 100000;

function generateRomajiPatterns(kana) {
    const patterns = [[]];
    let i = 0;

    while (i < kana.length) {
        let matched = false;

        // 2文字の組み合わせをチェック（拗音など）
        if (i + 1 < kana.length) {
            const twoChars = kana.substring(i, i + 2);

            // 促音「っ」「ッ」の処理
            if (twoChars[0] === 'っ' || twoChars[0] === 'ッ') {
                const nextChar = kana[i + 1];

                // 次の文字のローマ字を取得
                let nextRomaji = null;
                if (i + 2 < kana.length) {
                    const nextTwoChars = kana.substring(i + 1, i + 3);
                    nextRomaji = KANA_TO_ROMAJI[nextTwoChars] || KATAKANA_TO_ROMAJI[nextTwoChars];
                }
                if (!nextRomaji) {
                    nextRomaji = KANA_TO_ROMAJI[nextChar] || KATAKANA_TO_ROMAJI[nextChar];
                }

                if (nextRomaji && nextRomaji[0] && nextRomaji[0][0]) {
                    // 次の子音を重ねる
                    const consonant = nextRomaji[0][0];
                    const newPatterns = [];
                    for (const pattern of patterns) {
                        newPatterns.push([...pattern, consonant]);
                        if (newPatterns.length >= MAX_PATTERNS) break;
                    }
                    patterns.length = 0;
                    for (const p of newPatterns) patterns.push(p);
                    i++;
                    matched = true;
                    continue;
                } else {
                    // ローマ字が見つからない場合はそのまま
                    const newPatterns = [];
                    for (const pattern of patterns) {
                        newPatterns.push([...pattern, 'っ']);
                    }
                    patterns.length = 0;
                    for (const p of newPatterns) patterns.push(p);
                    i++;
                    matched = true;
                    continue;
                }
            }

            // 拗音のチェック
            const romajiOptions = KANA_TO_ROMAJI[twoChars] || KATAKANA_TO_ROMAJI[twoChars];
            if (romajiOptions) {
                const newPatterns = [];
                for (const pattern of patterns) {
                    for (const option of romajiOptions) {
                        newPatterns.push([...pattern, option]);
                        if (newPatterns.length >= MAX_PATTERNS) break;
                    }
                    if (newPatterns.length >= MAX_PATTERNS) break;
                }
                patterns.length = 0;
                for (const p of newPatterns) patterns.push(p);
                i += 2;
                matched = true;
                continue;
            }
        }

        // 1文字の変換
        const char = kana[i];
        const romajiOptions = KANA_TO_ROMAJI[char] || KATAKANA_TO_ROMAJI[char];

        if (romajiOptions) {
            const newPatterns = [];
            for (const pattern of patterns) {
                for (const option of romajiOptions) {
                    newPatterns.push([...pattern, option]);
                    if (newPatterns.length >= MAX_PATTERNS) break;
                }
                if (newPatterns.length >= MAX_PATTERNS) break;
            }
            patterns.length = 0;
            for (const p of newPatterns) patterns.push(p);
            matched = true;
        } else if (/[a-zA-Z0-9]/.test(char)) {
            // 英数字はそのまま
            const newPatterns = [];
            for (const pattern of patterns) {
                newPatterns.push([...pattern, char]);
            }
            patterns.length = 0;
            for (const p of newPatterns) patterns.push(p);
            matched = true;
        } else if (/[\s　]/.test(char)) {
            // スペースは無視
            matched = true;
        } else if (/[、。！？「」（）・ー]/.test(char)) {
            // 記号の処理
            const symbolMap = {
                '、': ',',
                '。': '.',
                '！': '!',
                '？': '?',
                '「': '"',
                '」': '"',
                '（': '(',
                '）': ')',
                '・': '･',
                'ー': '-'
            };
            const symbol = symbolMap[char] || char;
            const newPatterns = [];
            for (const pattern of patterns) {
                newPatterns.push([...pattern, symbol]);
            }
            patterns.length = 0;
            for (const p of newPatterns) patterns.push(p);
            matched = true;
        } else {
            // その他の文字（漢字など）はそのまま
            const newPatterns = [];
            for (const pattern of patterns) {
                newPatterns.push([...pattern, char]);
            }
            patterns.length = 0;
            for (const p of newPatterns) patterns.push(p);
            matched = true;
        }

        i++;
    }

    // パターンを文字列に変換
    const result = patterns.map(pattern => pattern.join(''));

    // 重複を削除
    return [...new Set(result)];
}

// 各項目を処理
let updatedCount = 0;
for (let i = 0; i < aphorisms.length; i++) {
    const item = aphorisms[i];
    const kana = item.kana;

    if (!kana) {
        console.warn(`Warning: No kana for id ${item.id}, skipping...`);
        continue;
    }

    // ローマ字パターンを生成
    const patterns = generateRomajiPatterns(kana);

    // パターン数が多すぎる場合は警告
    if (patterns.length > MAX_PATTERNS) {
        console.warn(`Warning: Too many patterns (${patterns.length}) for id ${item.id} ("${item.original}"), limited to ${MAX_PATTERNS}`);
    }

    // tokensを更新
    item.tokens = patterns;
    item.text = patterns[0];

    updatedCount++;

    if (updatedCount % 10 === 0) {
        console.log(`Processed ${updatedCount}/${aphorisms.length} aphorisms...`);
    }
}

console.log(`Updated ${updatedCount} aphorisms.`);

// 結果を書き戻す
const output = `export const APHORISMS = ${JSON.stringify(aphorisms, null, 4)};`;
fs.writeFileSync('./src/data/usutakuData.js', output, 'utf-8');

console.log('Done! Updated src/data/usutakuData.js');
