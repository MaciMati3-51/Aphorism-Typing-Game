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

        const content = fs.readFileSync('usutaku_DB_utf8.csv', 'utf-8');
        const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');

        const data = [];
        let id = 1;

        console.log(`Processing ${lines.length} lines...`);

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            try {
                // Convert to Kunrei-shiki (nippon)
                let romajiRaw = await kuroshiro.convert(trimmedLine, { to: 'romaji', mode: 'spaced', romajiSystem: 'nippon' });

                // Remove newlines
                romajiRaw = romajiRaw.replace(/[\r\n]+/g, '');

                // Expand Macrons for typing (Standard input style)
                // ō -> ou, ū -> uu, etc.
                romajiRaw = romajiRaw
                    .replace(/[āâ]/g, 'aa')
                    .replace(/[īî]/g, 'ii')
                    .replace(/[ūû]/g, 'uu')
                    .replace(/[ēê]/g, 'ee')
                    .replace(/[ōô]/g, 'ou'); // Standard typing convention

                // Create tokens (split by space)
                const tokens = romajiRaw.trim().split(/\s+/);
                const fullText = tokens.join('');

                let kanaResult = await kuroshiro.convert(trimmedLine, { to: 'hiragana', mode: 'normal' });

                data.push({
                    id: id++,
                    text: fullText,
                    tokens: tokens, // Array of Kunrei tokens
                    kana: kanaResult,
                    original: trimmedLine
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
