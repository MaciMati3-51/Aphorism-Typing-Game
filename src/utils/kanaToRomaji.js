/**
 * ひらがな→ローマ字変換表（訓令式ベース、複数入力許容）
 * 各ひらがなに対して、許容するローマ字表記を配列で定義
 * 配列の最初の要素が優先（出力時に使用）
 *
 * 重要な点：
 * - 基本は訓令式（si, ti, tu, hu など）を優先
 * - ヘボン式（shi, chi, tsu, fu など）も許容
 * - 「は」は ha 優先だが wa も許容
 */

// 基本的なひらがな→ローマ字変換マップ
export const KANA_TO_ROMAJI = {
  // あ行
  'あ': ['a'],
  'い': ['i'],
  'う': ['u'],
  'え': ['e'],
  'お': ['o'],

  // か行
  'か': ['ka'],
  'き': ['ki'],
  'く': ['ku'],
  'け': ['ke'],
  'こ': ['ko'],
  'が': ['ga'],
  'ぎ': ['gi'],
  'ぐ': ['gu'],
  'げ': ['ge'],
  'ご': ['go'],

  // さ行
  'さ': ['sa'],
  'し': ['si', 'shi', 'ci'],  // 訓令式優先、ヘボン式・ciも許容
  'す': ['su'],
  'せ': ['se'],
  'そ': ['so'],
  'ざ': ['za'],
  'じ': ['zi', 'ji'],  // 訓令式優先、ヘボン式も許容
  'ず': ['zu'],
  'ぜ': ['ze'],
  'ぞ': ['zo'],

  // た行
  'た': ['ta'],
  'ち': ['ti', 'chi'],  // 訓令式優先、ヘボン式も許容
  'つ': ['tu', 'tsu'],  // 訓令式優先、ヘボン式も許容
  'て': ['te'],
  'と': ['to'],
  'だ': ['da'],
  'ぢ': ['di'],
  'づ': ['du'],
  'で': ['de'],
  'ど': ['do'],

  // な行
  'な': ['na'],
  'に': ['ni'],
  'ぬ': ['nu'],
  'ね': ['ne'],
  'の': ['no'],

  // は行
  'は': ['ha', 'wa'],  // ha優先、助詞でもどちらでもOK
  'ひ': ['hi'],
  'ふ': ['hu', 'fu'],  // 訓令式優先、ヘボン式も許容
  'へ': ['he', 'e'],   // he優先、助詞でeも許容
  'ほ': ['ho'],
  'ば': ['ba'],
  'び': ['bi'],
  'ぶ': ['bu'],
  'べ': ['be'],
  'ぼ': ['bo'],
  'ぱ': ['pa'],
  'ぴ': ['pi'],
  'ぷ': ['pu'],
  'ぺ': ['pe'],
  'ぽ': ['po'],

  //ま行
  'ま': ['ma'],
  'み': ['mi'],
  'む': ['mu'],
  'め': ['me'],
  'も': ['mo'],

  // や行
  'や': ['ya'],
  'ゆ': ['yu'],
  'よ': ['yo'],

  // ら行
  'ら': ['ra'],
  'り': ['ri'],
  'る': ['ru'],
  'れ': ['re'],
  'ろ': ['ro'],

  // わ行
  'わ': ['wa'],
  'ゐ': ['wi'],
  'ゑ': ['we'],
  'を': ['wo', 'o'],  // wo優先、oも許容
  'ん': ['n', 'nn', 'xn'],  // n優先、nnやxnも許容

  // 小書き文字
  'ぁ': ['la', 'xa'],
  'ぃ': ['li', 'xi'],
  'ぅ': ['lu', 'xu'],
  'ぇ': ['le', 'xe'],
  'ぉ': ['lo', 'xo'],
  'ゃ': ['ya'],
  'ゅ': ['yu'],
  'ょ': ['yo'],
  'ゎ': ['lwa', 'xwa'],
  'っ': ['ltu', 'xtu', 'ltsu'],  // 促音単体

  // 拗音用（きゃ、きゅ、きょ など）
  'きゃ': ['kya'],
  'きゅ': ['kyu'],
  'きょ': ['kyo'],
  'しゃ': ['sya', 'sha'],
  'しゅ': ['syu', 'shu'],
  'しょ': ['syo', 'sho'],
  'ちゃ': ['tya', 'cha', 'cya'],
  'ちゅ': ['tyu', 'chu', 'cyu'],
  'ちょ': ['tyo', 'cho', 'cyo'],
  'にゃ': ['nya'],
  'にゅ': ['nyu'],
  'にょ': ['nyo'],
  'ひゃ': ['hya'],
  'ひゅ': ['hyu'],
  'ひょ': ['hyo'],
  'みゃ': ['mya'],
  'みゅ': ['myu'],
  'みょ': ['myo'],
  'りゃ': ['rya'],
  'りゅ': ['ryu'],
  'りょ': ['ryo'],
  'ぎゃ': ['gya'],
  'ぎゅ': ['gyu'],
  'ぎょ': ['gyo'],
  'じゃ': ['zya', 'ja', 'jya'],
  'じゅ': ['zyu', 'ju', 'jyu'],
  'じょ': ['zyo', 'jo', 'jyo'],
  'びゃ': ['bya'],
  'びゅ': ['byu'],
  'びょ': ['byo'],
  'ぴゃ': ['pya'],
  'ぴゅ': ['pyu'],
  'ぴょ': ['pyo'],

  // ファ行など（ひらがなにも対応）
  'ふぁ': ['fa', 'hwa'],
  'ふぃ': ['fi', 'hwi'],
  'ふぇ': ['fe', 'hwe'],
  'ふぉ': ['fo', 'hwo'],
  'ふゅ': ['fyu'],

  // ウィ、ウェ、ウォなど
  'うぃ': ['wi', 'whi'],
  'うぇ': ['we', 'whe'],
  'うぉ': ['wo'],

  // ヴァ行
  'ゔぁ': ['va'],
  'ゔぃ': ['vi'],
  'ゔ': ['vu'],
  'ゔぇ': ['ve'],
  'ゔぉ': ['vo'],

  // ティ、ディなど
  'てぃ': ['teli', 'texi', 'thi'],
  'でぃ': ['deli', 'dexi', 'dhi'],
  'でゅ': ['delyu', 'dexyu', 'dhu'],
  'とぅ': ['tolu', 'toxu', 'twu'],
  'どぅ': ['dolu', 'doxu', 'dwu'],

  // その他記号
  '、': [','],
  '。': ['.'],
  '！': ['!'],
  '？': ['?'],
  '「': ['"'],
  '」': ['"'],
  '（': ['('],
  '）': [')'],
  '・': ['･'],
  'ー': ['-'],
  '　': [' '],  // 全角スペース
};

// カタカナ→ローマ字変換マップ
export const KATAKANA_TO_ROMAJI = {
  // ア行
  'ア': ['a'],
  'イ': ['i'],
  'ウ': ['u'],
  'エ': ['e'],
  'オ': ['o'],

  // カ行
  'カ': ['ka'],
  'キ': ['ki'],
  'ク': ['ku'],
  'ケ': ['ke'],
  'コ': ['ko'],
  'ガ': ['ga'],
  'ギ': ['gi'],
  'グ': ['gu'],
  'ゲ': ['ge'],
  'ゴ': ['go'],

  // サ行
  'サ': ['sa'],
  'シ': ['si', 'shi', 'ci'],
  'ス': ['su'],
  'セ': ['se'],
  'ソ': ['so'],
  'ザ': ['za'],
  'ジ': ['zi', 'ji'],
  'ズ': ['zu'],
  'ゼ': ['ze'],
  'ゾ': ['zo'],

  // タ行
  'タ': ['ta'],
  'チ': ['ti', 'chi'],
  'ツ': ['tu', 'tsu'],
  'テ': ['te'],
  'ト': ['to'],
  'ダ': ['da'],
  'ヂ': ['di'],
  'ヅ': ['du'],
  'デ': ['de'],
  'ド': ['do'],

  // ナ行
  'ナ': ['na'],
  'ニ': ['ni'],
  'ヌ': ['nu'],
  'ネ': ['ne'],
  'ノ': ['no'],

  // ハ行
  'ハ': ['ha', 'wa'],
  'ヒ': ['hi'],
  'フ': ['hu', 'fu'],
  'ヘ': ['he', 'e'],
  'ホ': ['ho'],
  'バ': ['ba'],
  'ビ': ['bi'],
  'ブ': ['bu'],
  'ベ': ['be'],
  'ボ': ['bo'],
  'パ': ['pa'],
  'ピ': ['pi'],
  'プ': ['pu'],
  'ペ': ['pe'],
  'ポ': ['po'],

  // マ行
  'マ': ['ma'],
  'ミ': ['mi'],
  'ム': ['mu'],
  'メ': ['me'],
  'モ': ['mo'],

  // ヤ行
  'ヤ': ['ya'],
  'ユ': ['yu'],
  'ヨ': ['yo'],

  // ラ行
  'ラ': ['ra'],
  'リ': ['ri'],
  'ル': ['ru'],
  'レ': ['re'],
  'ロ': ['ro'],

  // ワ行
  'ワ': ['wa'],
  'ヰ': ['wi'],
  'ヱ': ['we'],
  'ヲ': ['wo', 'o'],
  'ン': ['n', 'nn', 'xn'],

  // 小書き文字
  'ァ': ['la', 'xa'],
  'ィ': ['li', 'xi'],
  'ゥ': ['lu', 'xu'],
  'ェ': ['le', 'xe'],
  'ォ': ['lo', 'xo'],
  'ャ': ['ya'],
  'ュ': ['yu'],
  'ョ': ['yo'],
  'ヮ': ['lwa', 'xwa'],
  'ッ': ['ltu', 'xtu', 'ltsu'],

  // 拗音
  'キャ': ['kya'],
  'キュ': ['kyu'],
  'キョ': ['kyo'],
  'シャ': ['sya', 'sha'],
  'シュ': ['syu', 'shu'],
  'ショ': ['syo', 'sho'],
  'チャ': ['tya', 'cha', 'cya'],
  'チュ': ['tyu', 'chu', 'cyu'],
  'チョ': ['tyo', 'cho', 'cyo'],
  'ニャ': ['nya'],
  'ニュ': ['nyu'],
  'ニョ': ['nyo'],
  'ヒャ': ['hya'],
  'ヒュ': ['hyu'],
  'ヒョ': ['hyo'],
  'ミャ': ['mya'],
  'ミュ': ['myu'],
  'ミョ': ['myo'],
  'リャ': ['rya'],
  'リュ': ['ryu'],
  'リョ': ['ryo'],
  'ギャ': ['gya'],
  'ギュ': ['gyu'],
  'ギョ': ['gyo'],
  'ジャ': ['zya', 'ja', 'jya'],
  'ジュ': ['zyu', 'ju', 'jyu'],
  'ジョ': ['zyo', 'jo', 'jyo'],
  'ビャ': ['bya'],
  'ビュ': ['byu'],
  'ビョ': ['byo'],
  'ピャ': ['pya'],
  'ピュ': ['pyu'],
  'ピョ': ['pyo'],

  // 外来音
  'ファ': ['fa', 'hwa'],
  'フィ': ['fi', 'hwi'],
  'フェ': ['fe', 'hwe'],
  'フォ': ['fo', 'hwo'],
  'フュ': ['fyu'],
  'ウィ': ['wi', 'whi'],
  'ウェ': ['we', 'whe'],
  'ウォ': ['wo'],
  'ヴァ': ['va'],
  'ヴィ': ['vi'],
  'ヴ': ['vu'],
  'ヴェ': ['ve'],
  'ヴォ': ['vo'],
  'ティ': ['teli', 'texi', 'thi'],
  'ディ': ['deli', 'dexi', 'dhi'],
  'デュ': ['delyu', 'dexyu', 'dhu'],
  'トゥ': ['tolu', 'toxu', 'twu'],
  'ドゥ': ['dolu', 'doxu', 'dwu'],

  // その他記号
  '、': [','],
  '。': ['.'],
  '！': ['!'],
  '？': ['?'],
  '「': ['"'],
  '」': ['"'],
  '（': ['('],
  '）': [')'],
  '・': ['･'],
  'ー': ['-'],
  '　': [' '],
};

/**
 * ひらがな・カタカナをローマ字に変換
 * @param {string} text - 変換する文字列（ひらがな・カタカナ混在可）
 * @returns {string} - ローマ字文字列（優先形式）
 */
export function kanaToRomaji(text) {
  let result = '';
  let i = 0;

  while (i < text.length) {
    let matched = false;

    // 2文字の組み合わせをチェック（拗音など）
    if (i + 1 < text.length) {
      const twoChars = text.substring(i, i + 2);

      // 促音「っ」「ッ」の処理
      if (twoChars[0] === 'っ' || twoChars[0] === 'ッ') {
        const nextChar = text[i + 1];
        // まず2文字の組み合わせをチェック
        let nextRomaji = null;
        if (i + 2 < text.length) {
          const nextTwoChars = text.substring(i + 1, i + 3);
          nextRomaji = KANA_TO_ROMAJI[nextTwoChars] || KATAKANA_TO_ROMAJI[nextTwoChars];
        }
        // 2文字が見つからなければ1文字をチェック
        if (!nextRomaji) {
          nextRomaji = KANA_TO_ROMAJI[nextChar] || KATAKANA_TO_ROMAJI[nextChar];
        }
        if (nextRomaji && nextRomaji[0] && nextRomaji[0][0]) {
          result += nextRomaji[0][0]; // 次の子音を重ねる（配列の最初の要素の最初の文字）
          i++;
          matched = true;
          continue;
        } else {
          // ローマ字が見つからない場合はそのまま出力
          result += 'っ';
          i++;
          matched = true;
          continue;
        }
      }

      // 拗音のチェック
      if (KANA_TO_ROMAJI[twoChars]) {
        result += KANA_TO_ROMAJI[twoChars][0]; // 配列の最初の要素（優先）
        i += 2;
        matched = true;
        continue;
      }
      if (KATAKANA_TO_ROMAJI[twoChars]) {
        result += KATAKANA_TO_ROMAJI[twoChars][0]; // 配列の最初の要素（優先）
        i += 2;
        matched = true;
        continue;
      }
    }

    // 1文字の変換
    const char = text[i];

    // 通常の変換
    if (KANA_TO_ROMAJI[char]) {
      result += KANA_TO_ROMAJI[char][0]; // 配列の最初の要素（優先）
      matched = true;
    } else if (KATAKANA_TO_ROMAJI[char]) {
      result += KATAKANA_TO_ROMAJI[char][0]; // 配列の最初の要素（優先）
      matched = true;
    } else if (/[a-zA-Z0-9]/.test(char)) {
      // 英数字はそのまま
      result += char;
      matched = true;
    } else if (/[\s　]/.test(char)) {
      // スペースはそのまま
      result += ' ';
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
      result += symbolMap[char] || char;
      matched = true;
    } else {
      // その他の文字（漢字など）はそのまま
      result += char;
      matched = true;
    }

    i++;
  }

  return result;
}

/**
 * 文字列をトークンに分割する
 * スペースで区切られた単語ごとにトークン化
 * @param {string} romajiText - ローマ字文字列
 * @returns {Array<string>} - トークン配列
 */
export function tokenizeRomaji(romajiText) {
  return romajiText.trim().split(/\s+/).filter(token => token.length > 0);
}
