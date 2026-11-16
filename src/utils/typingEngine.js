/**
 * ローマ字入力の判定エンジン
 *
 * 「かな1文字 = ローマ字候補の配列」で1文字ずつ照合する方式をやめ、
 * 読み（かな文字列）全体に対して「いま打てる全ての打ち方」を同時に追跡する。
 *
 * - し = si / shi / ci、しゃ = sya / sha / si+xya ... を出題文に関係なく全て受理
 * - 「ん」: 次が母音・や行・な行以外なら n 1打でも可。nn / n' / xn は常に可
 * - 「っ」: 次の子音を重ねる（kka, ssha, cchi ...）か、xtu / ltu などの単独入力
 * - 拗音は「まとめ打ち（kya）」と「分割打ち（ki + xya）」の両方を受理
 *
 * React に依存しない純粋関数だけで構成している（node --test でテスト可能）。
 */
import { ROMAJI_MASTER } from '../data/romajiMaster.js';

const VOWELS = 'aiueo';
// 「n」1打の直後にこれらが来ると別のかな（な行・にゃ行など）になるため、nn が必要
const N_BLOCKERS = 'aiueony';

// マスターに無い記号の補完（NFKC 正規化でも ASCII にならないもの）
const EXTRA_PATTERNS = {
    '〜': ['~'],
    '―': ['-'],
    '‐': ['-'],
    '−': ['-'],
    '“': ['"'],
    '”': ['"'],
    '’': ["'"],
    '‘': ["'"]
};

const TABLE = new Map();
for (const [kana, entry] of Object.entries(ROMAJI_MASTER)) {
    TABLE.set(kana, entry.patterns);
}
for (const [char, patterns] of Object.entries(EXTRA_PATTERNS)) {
    if (!TABLE.has(char)) TABLE.set(char, patterns);
}
const MAX_KEY_LENGTH = Math.max(...[...TABLE.keys()].map((key) => Array.from(key).length));

/** カタカナ → ひらがな（ヴ → ゔ も含む）。それ以外はそのまま */
const toHiragana = (char) => {
    const code = char.codePointAt(0);
    if (code >= 0x30a1 && code <= 0x30f6) {
        return String.fromCodePoint(code - 0x60);
    }
    return char;
};

/** 表から引けない1文字のローマ字候補（半角英数字・記号はそのキーを打つ） */
const fallbackPatterns = (key) => {
    if (/^[\x21-\x7e]$/.test(key)) return [key.toLowerCase()];
    return [];
};

/**
 * 読み文字列を「打鍵対象の文字」の配列に変換する。
 * 空白と、どのキーでも打てない文字（漢字の混入など）は除外する。
 * @returns {{ display: string, key: string }[]}
 */
export const toTypingChars = (kana) => {
    const chars = [];
    for (const raw of Array.from(String(kana ?? ''))) {
        if (/\s/.test(raw)) continue;
        // 表にそのまま載っている文字（…・！・？ など）は正規化せずに使う
        const units = TABLE.has(raw) ? [raw] : Array.from(raw.normalize('NFKC'));
        for (const unit of units) {
            if (/\s/.test(unit)) continue;
            const key = toHiragana(unit);
            if (!TABLE.has(key) && fallbackPatterns(key).length === 0) continue;
            chars.push({ display: unit, key });
        }
    }
    return chars;
};

/**
 * pos 文字目から始まる「打ち方の候補」を列挙する。
 * 候補 = { romaji: 打つ文字列, len: 消費するかな数, cuts: [[ローマ字位置, 完了かな数], ...] }
 * 並び順が表示ガイドの優先順（先頭が既定の打ち方）。
 */
const candidatesAt = (plan, pos) => {
    if (pos >= plan.keys.length) return [];
    if (plan.candidates[pos]) return plan.candidates[pos];

    const { keys } = plan;
    const result = [];
    const seen = new Set();
    const add = (romaji, len, cuts) => {
        const id = `${len}:${romaji}`;
        if (seen.has(id)) return;
        seen.add(id);
        result.push({ romaji, len, cuts });
    };
    // 「1打 + 次の候補」を1つの候補として連結する（っ の子音重ね、ん の n 1打）
    const addChained = (head, next) => {
        add(
            head + next.romaji,
            1 + next.len,
            [[1, 1], ...next.cuts.map(([at, count]) => [at + 1, count + 1])]
        );
    };

    const key = keys[pos];

    if (key === 'ん') {
        // n 1打: 次の打鍵が母音・y・n でなければ「ん」として確定する
        for (const next of candidatesAt(plan, pos + 1)) {
            if (!N_BLOCKERS.includes(next.romaji[0])) addChained('n', next);
        }
    }

    if (key === 'っ') {
        // 次の子音を重ねる（母音と n は重ねても促音にならない）
        for (const next of candidatesAt(plan, pos + 1)) {
            const first = next.romaji[0];
            if (/[a-z]/.test(first) && !VOWELS.includes(first) && first !== 'n') {
                addChained(first, next);
            }
        }
    }

    // 表引き（長い並びを優先: 「しゃ」→ sya を「し」+「ゃ」より先に）
    for (let len = Math.min(MAX_KEY_LENGTH, keys.length - pos); len >= 1; len -= 1) {
        const patterns = TABLE.get(keys.slice(pos, pos + len).join(''));
        if (!patterns) continue;
        for (const romaji of patterns) {
            add(romaji, len, [[romaji.length, len]]);
        }
    }

    if (result.length === 0) {
        for (const romaji of fallbackPatterns(key)) {
            add(romaji, 1, [[romaji.length, 1]]);
        }
    }

    plan.candidates[pos] = result;
    return result;
};

/** pos 文字目以降を既定の打ち方で打った場合のローマ字（表示ガイド用） */
const guideFrom = (plan, pos) => {
    let guide = '';
    let cursor = pos;
    while (cursor < plan.keys.length) {
        const first = candidatesAt(plan, cursor)[0];
        if (!first) break;
        guide += first.romaji;
        cursor += first.len;
    }
    return guide;
};

const statesAt = (plan, pos) =>
    candidatesAt(plan, pos).map((candidate) => ({ pos, candidate, offset: 0 }));

/**
 * 1文ぶんの入力セッションを作る。
 * @param {string} kana - 読み（ひらがな・カタカナ・英数字・記号の混在可）
 */
export const createSession = (kana) => {
    const chars = toTypingChars(kana);
    const plan = {
        chars,
        keys: chars.map((char) => char.key),
        candidates: new Array(chars.length)
    };
    return {
        plan,
        states: statesAt(plan, 0),
        typed: '',
        done: chars.length === 0
    };
};

/**
 * 1打鍵を判定する。
 * @returns 次のセッション。ミス（どの打ち方にも合わない）なら null。
 */
export const typeKey = (session, rawKey) => {
    if (!session || session.done) return null;
    const key = String(rawKey).toLowerCase();
    const { plan } = session;

    const nextStates = [];
    const seen = new Set();
    let done = false;

    const push = (state) => {
        // 「同じ位置で終わる & 残りの打鍵が同じ」状態は等価なのでまとめる
        const end = state.pos + state.candidate.len;
        const id = `${end}:${state.candidate.romaji.slice(state.offset)}`;
        if (seen.has(id)) return;
        seen.add(id);
        nextStates.push(state);
    };

    for (const state of session.states) {
        const { pos, candidate, offset } = state;
        if (candidate.romaji[offset] !== key) continue;

        if (offset + 1 < candidate.romaji.length) {
            push({ pos, candidate, offset: offset + 1 });
            continue;
        }

        // この候補を打ち終えた → 次の位置の候補へ
        const nextPos = pos + candidate.len;
        if (nextPos >= plan.keys.length) {
            done = true;
        } else {
            for (const next of statesAt(plan, nextPos)) push(next);
        }
    }

    if (!done && nextStates.length === 0) return null;

    return {
        plan,
        states: done ? [] : nextStates,
        typed: session.typed + key,
        done
    };
};

/**
 * 表示用の情報を取り出す。
 * - chars: 読みの各文字
 * - kanaDone: 打ち終えたかな数（= 入力中の文字の位置）
 * - completedRomaji / currentInput: 打鍵済みローマ字（確定分 / 入力中の文字ぶん）
 * - remaining: これから打つローマ字。打ち方を途中で切り替えると追従する
 */
export const getView = (session) => {
    const chars = session.plan.chars.map((char) => char.display);
    const { typed } = session;

    if (session.done || session.states.length === 0) {
        return {
            chars,
            kanaDone: chars.length,
            typed,
            completedRomaji: typed,
            currentInput: '',
            remaining: ''
        };
    }

    // 先頭の状態 = 生き残っている打ち方のうち最優先のもの
    const { pos, candidate, offset } = session.states[0];
    let cutAt = 0;
    let kanaInCandidate = 0;
    for (const [at, count] of candidate.cuts) {
        if (at > offset) break;
        cutAt = at;
        kanaInCandidate = count;
    }
    const currentLength = offset - cutAt;

    return {
        chars,
        kanaDone: pos + kanaInCandidate,
        typed,
        completedRomaji: typed.slice(0, typed.length - currentLength),
        currentInput: typed.slice(typed.length - currentLength),
        remaining: candidate.romaji.slice(offset) + guideFrom(session.plan, pos + candidate.len)
    };
};

/** 次に受理されるキーの一覧（テスト・デバッグ用） */
export const nextKeys = (session) => {
    if (!session || session.done) return [];
    return [...new Set(session.states.map((state) => state.candidate.romaji[state.offset]))];
};
