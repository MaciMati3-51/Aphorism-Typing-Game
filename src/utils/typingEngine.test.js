import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSession, typeKey, getView, nextKeys } from './typingEngine.js';
import { APHORISMS } from '../data/usutakuData.js';

/** keys を順に打つ。途中でミスしたら打てた文字数を返す */
const type = (kana, keys) => {
    let session = createSession(kana);
    let accepted = 0;
    for (const key of keys) {
        const next = typeKey(session, key);
        if (!next) return { done: false, accepted, session };
        session = next;
        accepted += 1;
    }
    return { done: session.done, accepted, session };
};

const assertAccepts = (kana, keys) => {
    const result = type(kana, keys);
    assert.ok(
        result.done,
        `「${kana}」は "${keys}" で打てるべき（${result.accepted} 打目まで受理, done=${result.done}）`
    );
};

const assertRejects = (kana, keys) => {
    const result = type(kana, keys);
    assert.ok(!result.done, `「${kana}」は "${keys}" で完了してはいけない`);
};

test('基本の複数入力パターン', () => {
    const cases = {
        'し': ['si', 'shi', 'ci'],
        'ち': ['ti', 'chi'],
        'つ': ['tu', 'tsu'],
        'ふ': ['hu', 'fu'],
        'じ': ['zi', 'ji'],
        'は': ['ha', 'wa'],
        'へ': ['he', 'e'],
        'を': ['wo', 'o']
    };
    for (const [kana, patterns] of Object.entries(cases)) {
        for (const pattern of patterns) assertAccepts(kana, pattern);
    }
});

test('拗音: まとめ打ちと分割打ちの両方', () => {
    const cases = {
        'しゃ': ['sya', 'sha', 'sixya', 'shilya', 'cixya'],
        'しゅ': ['syu', 'shu'],
        'しょ': ['syo', 'sho'],
        'ちゃ': ['tya', 'cha', 'cya', 'chixya'],
        'ちゅ': ['tyu', 'chu', 'cyu'],
        'ちょ': ['tyo', 'cho', 'cyo'],
        'じゃ': ['zya', 'ja', 'jya', 'jixya'],
        'じゅ': ['zyu', 'ju', 'jyu'],
        'じょ': ['zyo', 'jo', 'jyo'],
        'きょ': ['kyo', 'kixyo', 'kilyo'],
        'ふぃ': ['fi', 'fuxi', 'huli'],
        'てぃ': ['thi', 'texi', 'teli']
    };
    for (const [kana, patterns] of Object.entries(cases)) {
        for (const pattern of patterns) assertAccepts(kana, pattern);
    }
});

test('同じ文字が続いても、文の途中で打ち方を切り替えられる', () => {
    assertAccepts('ししし', 'sishici');
    assertAccepts('じしゅじじつ', 'zisyujijitu');
    assertAccepts('じしゅじじつ', 'jishuzizitsu');
    assertAccepts('しゅっちょう', 'syuttyou');
    assertAccepts('しゅっちょう', 'shucchou');
});

test('「ん」: 子音の前は n / nn / n\' / xn のどれでも打てる', () => {
    assertAccepts('しんそつ', 'sinsotu');
    assertAccepts('しんそつ', 'shinnsotsu');
    assertAccepts('しんそつ', "sin'sotu");
    assertAccepts('しんそつ', 'sixnsotu');
    assertAccepts('かんがえ', 'kangae');
    assertAccepts('かんがえ', 'kanngae');
});

test('「ん」: 母音・や行・な行の前と文末は n 1打では確定しない', () => {
    assertAccepts('れんあい', 'rennai');
    assertRejects('れんあい', 'renai');
    assertAccepts('こんにちは', 'konnnitiha');
    assertAccepts('こんにちは', "kon'nichiwa");
    assertRejects('こんにちは', 'konnitiha');
    assertAccepts('こんや', 'konnya');
    assertRejects('こんや', 'konya');
    assertAccepts('ほん', 'honn');
    assertAccepts('ほん', 'hoxn');
    assertRejects('ほん', 'hon');
});

test('「ん」: 連続しても打てる', () => {
    assertAccepts('んん', 'nnnn');
    assertAccepts('しんんか', 'sinnnka');
});

test('「っ」: 子音重ねと単独入力', () => {
    assertAccepts('きって', 'kitte');
    assertAccepts('きって', 'kixtute');
    assertAccepts('きって', 'kiltsute');
    assertAccepts('いっしゅ', 'issyu');
    assertAccepts('いっしゅ', 'isshu');
    assertAccepts('いっしゅ', 'ixtusixyu');
    assertAccepts('ちっちゃい', 'ticchai');
    assertAccepts('ちっちゃい', 'tittyai');
    assertAccepts('ちっちゃい', 'chiccyai');
    assertAccepts('あっぷ', 'appu');
    assertAccepts('っっか', 'kkka');
});

test('「っ」: 重ねた子音と次の文字の打ち方が食い違う入力は受理しない', () => {
    // 旧実装は「c のあと ti」のような組み合わせを通していた
    assertRejects('っち', 'cti');
    assertRejects('っち', 'tchi');
    assertRejects('っし', 'cshi');
    // 母音と n は重ねても促音にならない
    assertRejects('っあ', 'aa');
    assertRejects('っな', 'nna');
    assertAccepts('っな', 'xtuna');
});

test('「ん」と「っ」の組み合わせ', () => {
    assertAccepts('んっと', 'ntto');
    assertAccepts('んっと', 'nnxtuto');
});

test('英数字・記号・全角文字・カタカナ', () => {
    assertAccepts('AIは', 'aiha');
    assertAccepts('AIは', 'AIwa');
    assertAccepts('100%', '100%');
    assertAccepts('しゃざい＋れんらく', 'shazai+renraku');
    assertAccepts('「さんか」', '[sanka]');
    assertAccepts('でーた', 'de-ta');
    assertAccepts('やるぞ！', 'yaruzo!');
    assertAccepts('シャツ', 'shatsu');
    assertAccepts('ヴァ', 'va');
});

test('空白と打てない文字は読み飛ばす（進行不能にならない）', () => {
    assertAccepts('こうきしん is All', 'koukisinnisall');
    assertAccepts('漢かな', 'kana');
    assert.equal(createSession('漢字').done, true);
});

test('ミスした打鍵は状態を進めない', () => {
    const session = createSession('しか');
    assert.equal(typeKey(session, 'k'), null);
    assert.deepEqual(nextKeys(session).sort(), ['c', 's']);
});

test('表示ガイドは打ち方の切り替えに追従する', () => {
    let session = createSession('しんし');
    assert.equal(getView(session).remaining, 'sinsi');

    session = typeKey(typeKey(session, 's'), 'h');
    let view = getView(session);
    assert.equal(view.currentInput, 'sh');
    assert.equal(view.remaining, 'insi');
    assert.equal(view.kanaDone, 0);

    session = typeKey(typeKey(session, 'i'), 'n');
    view = getView(session);
    assert.equal(view.completedRomaji, 'shin');
    assert.equal(view.kanaDone, 2);
    assert.equal(view.remaining, 'si');

    // n をもう1打しても「ん」の続きとして受理され、ガイドは変わらない
    session = typeKey(session, 'n');
    view = getView(session);
    assert.equal(view.typed, 'shinn');
    assert.equal(view.kanaDone, 2);
    assert.equal(view.remaining, 'si');
});

test('全出題文: ガイド通りに打てば完走できる', () => {
    assert.ok(APHORISMS.length > 0);
    for (const item of APHORISMS) {
        const guide = getView(createSession(item.kana)).remaining;
        assert.ok(guide.length > 0, `ガイドが空: ${item.original}`);
        assertAccepts(item.kana, guide);
    }
});

test('全出題文: 受理されるキーをどう選んでも必ず完走できる', () => {
    // 決定的な擬似乱数（テストの再現性のため）
    let seed = 12345;
    const random = () => {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return seed / 0x7fffffff;
    };

    for (const item of APHORISMS) {
        for (let round = 0; round < 20; round += 1) {
            let session = createSession(item.kana);
            let steps = 0;
            while (!session.done) {
                const keys = nextKeys(session);
                assert.ok(keys.length > 0, `行き止まり: ${item.original} (${session.typed})`);
                session = typeKey(session, keys[Math.floor(random() * keys.length)]);
                steps += 1;
                assert.ok(steps < 2000, `終わらない: ${item.original}`);
            }
        }
    }
});
