import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const Kuroshiro = require('kuroshiro');
const KuromojiAnalyzer = require('kuroshiro-analyzer-kuromoji');

console.log('Kuroshiro type:', typeof Kuroshiro);
const path = require('path');
const dictPath = path.resolve('node_modules/kuromoji/dict').replace(/\\/g, '/');
console.log('Using dictPath:', dictPath);

let kuroshiro;
try {
    kuroshiro = new Kuroshiro();
} catch (e) {
    if (Kuroshiro.default) {
        kuroshiro = new Kuroshiro.default();
    } else {
        throw e;
    }
}
let analyzer;
try {
    analyzer = new KuromojiAnalyzer({ dictPath });
} catch (e) {
    if (KuromojiAnalyzer.default) {
        analyzer = new KuromojiAnalyzer.default({ dictPath });
    } else {
        try {
            analyzer = new KuromojiAnalyzer({ dictPath });
        } catch (e2) {
            throw e;
        }
    }
}

const run = async () => {
    try {
        console.log("Initializing Kuroshiro...");
        try {
            await kuroshiro.init(analyzer);
            console.log("Kuroshiro initialized successfully.");
        } catch (initError) {
            console.error("Kuroshiro initialization failed:", initError);
            process.exit(1);
        }

        const content = fs.readFileSync('usutaku_DB_final.csv', 'utf-8');
        const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');

        const data = [];
        let id = 1;

        console.log(`Processing ${lines.length} lines...`);

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            try {
                // Parse CSV: split by comma into 2 columns
                const parts = trimmedLine.split(',');
                const originalText = parts[0].trim();
                const existingRomaji = parts[1] ? parts[1].trim() : null;

                let tokens;
                let fullText;

                if (existingRomaji) {
                    // If romaji already exists in CSV, use it
                    tokens = existingRomaji.split('|').map(t => t.trim());

                    // Generate alternative patterns for long vowels (延ばし棒)
                    // Convert ALL occurrences of ou/uu/ii/ee/aa to - (hyphen)
                    const expandedTokens = [...tokens];
                    for (const token of tokens) {
                        // Replace ALL long vowels with hyphen (not just at word end)
                        let hyphenVersion = token;

                        // Replace all double vowels globally (in order: uu, ou, ii, ee, aa)
                        hyphenVersion = hyphenVersion.replace(/uu/g, 'u-');
                        hyphenVersion = hyphenVersion.replace(/ou/g, 'o-');
                        hyphenVersion = hyphenVersion.replace(/ii/g, 'i-');
                        hyphenVersion = hyphenVersion.replace(/ee/g, 'e-');
                        hyphenVersion = hyphenVersion.replace(/aa/g, 'a-');

                        // Normalize multiple consecutive hyphens to single hyphen
                        hyphenVersion = hyphenVersion.replace(/-+/g, '-');

                        if (hyphenVersion !== token && !expandedTokens.includes(hyphenVersion)) {
                            expandedTokens.unshift(hyphenVersion); // Add hyphen version at the beginning (priority)
                        }
                    }

                    tokens = expandedTokens;
                    fullText = tokens[0];
                } else {
                    // If no romaji in CSV, convert using kuroshiro
                    let romajiRaw = await kuroshiro.convert(originalText, {
                        to: 'romaji',
                        mode: 'spaced',
                        romajiSystem: 'nippon'
                    });

                    // Remove newlines
                    romajiRaw = romajiRaw.replace(/[\r\n]+/g, '');

                    // Expand Macrons for typing (Standard input style)
                    romajiRaw = romajiRaw
                        .replace(/[āâ]/g, 'aa')
                        .replace(/[īî]/g, 'ii')
                        .replace(/[ūû]/g, 'uu')
                        .replace(/[ēê]/g, 'ee')
                        .replace(/[ōô]/g, 'ou');

                    // Convert long vowel marker to hyphen
                    romajiRaw = romajiRaw.replace(/ー/g, '-');

                    // Create tokens (split by space)
                    tokens = romajiRaw.trim().split(/\s+/);
                    fullText = tokens.join('');
                }

                let kanaResult = await kuroshiro.convert(originalText, {
                    to: 'hiragana',
                    mode: 'normal'
                });

                data.push({
                    id: id++,
                    text: fullText,
                    tokens: tokens,
                    kana: kanaResult,
                    original: originalText
                });
            } catch (convError) {
                console.error(`Failed to convert line: ${trimmedLine}`, convError);
            }
        }

        const fileContent = `export const APHORISMS = ${JSON.stringify(data, null, 4)};`;
        fs.writeFileSync('src/data/usutakuData.js', fileContent);
        console.log("Done! Written to src/data/usutakuData.js");

    } catch (e) {
        console.error("Global Error:", e);
    }
};

run();
