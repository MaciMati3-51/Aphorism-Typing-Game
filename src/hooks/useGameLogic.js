import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAudio } from './useAudio';
import { APHORISMS } from '../data/usutakuData';
import { ROMAJI_MASTER, N_REQUIRES_DOUBLE } from '../data/romajiMaster';

const GAME_DURATION = 60;
const MAX_WORD_MISTAKES = 3;

/**
 * 「ん」の後に来る文字によって、利用可能なローマ字パターンを調整
 * @param {string[]} basePatterns - 基本のローマ字パターン
 * @param {object|null} nextChar - 次の文字オブジェクト
 * @returns {string[]} 調整後のローマ字パターン
 */
const adjustNPatterns = (basePatterns, nextChar) => {
    if (!nextChar) {
        // 文末の「ん」は n でも OK
        return ['n', ...basePatterns.filter(p => p !== 'n')];
    }

    const nextRomaji = nextChar.romaji;
    if (!nextRomaji || nextRomaji.length === 0) {
        return ['n', ...basePatterns.filter(p => p !== 'n')];
    }

    // 次の文字の最初のローマ字の最初の文字を確認
    const firstRomajiChar = nextRomaji[0][0]?.toLowerCase();
    if (firstRomajiChar && N_REQUIRES_DOUBLE.includes(firstRomajiChar)) {
        // nn必須（nを除外）
        return basePatterns.filter(p => p !== 'n');
    } else {
        // n でも OK
        return ['n', ...basePatterns.filter(p => p !== 'n')];
    }
};

/**
 * 促音「っ」の処理
 * 次の文字の子音を重ねるパターンを生成
 */
const adjustSokuonPatterns = (basePatterns, nextChar) => {
    if (!nextChar) {
        return basePatterns; // 次の文字がない場合は独立入力のみ
    }

    const nextRomaji = nextChar.romaji;
    if (!nextRomaji || nextRomaji.length === 0) {
        return basePatterns;
    }

    const sokuonPatterns = [];

    // 子音を重ねるパターンを生成
    for (const nextPattern of nextRomaji) {
        if (nextPattern.length > 0 && /^[a-z]/.test(nextPattern)) {
            const firstChar = nextPattern[0];
            // 母音で始まる場合は促音なし
            if (!['a', 'i', 'u', 'e', 'o'].includes(firstChar)) {
                sokuonPatterns.push(firstChar);
            }
        }
    }

    // 独立入力パターンも追加
    return [...new Set([...sokuonPatterns, ...basePatterns])];
};

/**
 * ゲームデータを新形式に変換
 */
const convertAphorismsToGameData = (aphorisms) => {
    return aphorisms.map((item) => {
        // 各文字のローマ字パターンを調整
        const characters = item.characters.map((charObj, index) => {
            let romaji = charObj.romaji;
            const nextChar = item.characters[index + 1] || null;

            // 「ん」の処理
            if (charObj.char === 'ん' || charObj.char === 'ン') {
                romaji = adjustNPatterns(romaji, nextChar);
            }

            // 「っ」の処理
            if (charObj.char === 'っ' || charObj.char === 'ッ') {
                romaji = adjustSokuonPatterns(romaji, nextChar);
            }

            return {
                ...charObj,
                romaji
            };
        });

        // 表示用ローマ字を生成（各文字の最初のパターンを結合）
        const displayRomaji = characters.map(c => c.romaji[0] || '').join('');

        return {
            id: item.id,
            original: item.original,
            characters,
            displayRomaji
        };
    });
};

export const useGameLogic = () => {
    const [gameState, setGameState] = useState('idle');
    const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
    const [score, setScore] = useState(0);

    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [currentCharIndex, setCurrentCharIndex] = useState(0);
    const [currentCharInput, setCurrentCharInput] = useState('');
    const [completedRomaji, setCompletedRomaji] = useState('');

    const [wordMistakes, setWordMistakes] = useState(0);
    const [isInefficient, setIsInefficient] = useState(false);

    const [totalCorrectChars, setTotalCorrectChars] = useState(0);
    const [totalMistakes, setTotalMistakes] = useState(0);

    const [feedback, setFeedback] = useState(null);
    const { playSound } = useAudio();

    const [aphorisms, setAphorisms] = useState([]);
    const [shuffledAphorisms, setShuffledAphorisms] = useState([]);

    useEffect(() => {
        const gameData = convertAphorismsToGameData(APHORISMS);
        setAphorisms(gameData);
        setShuffledAphorisms([...gameData].sort(() => 0.5 - Math.random()));
    }, []);

    const wordPool = shuffledAphorisms.length > 0 ? shuffledAphorisms : aphorisms;
    const rawWord = wordPool.length > 0 ? wordPool[currentWordIndex % wordPool.length] : null;

    const currentWord = useMemo(() => {
        if (!rawWord) {
            return {
                id: 0,
                original: '',
                characters: [],
                displayRomaji: ''
            };
        }
        return rawWord;
    }, [rawWord]);

    // 現在の文字オブジェクトを取得
    const currentChar = useMemo(() => {
        if (!currentWord.characters || currentCharIndex >= currentWord.characters.length) {
            return null;
        }
        return currentWord.characters[currentCharIndex];
    }, [currentWord.characters, currentCharIndex]);

    // 表示用データを生成
    const displayWord = useMemo(() => {
        // 残りの文字のローマ字を生成
        const remainingRomaji = currentWord.characters
            .slice(currentCharIndex)
            .map(c => c.romaji[0] || '')
            .join('');

        // 現在入力中の部分を除いた残り
        const pendingRomaji = remainingRomaji.slice(currentCharInput.length);

        return {
            ...currentWord,
            text: currentWord.displayRomaji,
            tokens: [currentWord.displayRomaji],
            completedRomaji,
            currentCharInput,
            pendingRomaji,
            currentCharIndex
        };
    }, [currentWord, completedRomaji, currentCharInput, currentCharIndex]);

    const startTimeRef = useRef(null);

    const startGame = useCallback(() => {
        setGameState('playing');
        setTimeLeft(GAME_DURATION);
        startTimeRef.current = Date.now();
        setScore(0);
        setCurrentWordIndex(0);
        setCurrentCharIndex(0);
        setCurrentCharInput('');
        setCompletedRomaji('');
        setWordMistakes(0);
        setIsInefficient(false);
        setTotalCorrectChars(0);
        setTotalMistakes(0);
        if (aphorisms.length > 0) {
            setShuffledAphorisms([...aphorisms].sort(() => 0.5 - Math.random()));
        }
    }, [aphorisms]);

    const endGame = useCallback(() => {
        setGameState('finished');
        if (score >= 5000) playSound('finish_godlike');
        else if (score >= 2000) playSound('finish_good');
        else playSound('finish_bad');
    }, [score, playSound]);

    useEffect(() => {
        if (gameState !== 'playing') return;
        const timer = setInterval(() => {
            const now = Date.now();
            const elapsedSeconds = Math.floor((now - startTimeRef.current) / 1000);
            const remaining = GAME_DURATION - elapsedSeconds;
            if (remaining <= 0) {
                setTimeLeft(0);
                clearInterval(timer);
                endGame();
            } else {
                setTimeLeft(remaining);
            }
        }, 100);
        return () => clearInterval(timer);
    }, [gameState, endGame]);

    /**
     * 1文字ずつの入力判定
     */
    const handleInput = useCallback((char) => {
        if (gameState !== 'playing') return;
        if (!currentChar) return;

        const romajiOptions = currentChar.romaji || [];
        if (romajiOptions.length === 0) return;

        const nextInput = (currentCharInput + char).toLowerCase();

        // 前方一致チェック
        const prefixMatches = romajiOptions.filter(r => r.startsWith(nextInput));
        const exactMatches = romajiOptions.filter(r => r === nextInput);

        if (import.meta.env.DEV) {
            console.debug('[typing-check]', {
                char: currentChar.char,
                romajiOptions,
                input: nextInput,
                prefixMatches,
                exactMatches
            });
        }

        if (prefixMatches.length === 0) {
            // ミス
            setTotalMistakes(prev => prev + 1);
            setScore(prev => Math.max(0, prev - 100));
            setFeedback({ type: 'mistake', id: Date.now() });
            playSound('mistake');

            setWordMistakes(prev => {
                const newCount = prev + 1;
                if (newCount === MAX_WORD_MISTAKES) {
                    setIsInefficient(true);
                    playSound('sdgs');
                    setTimeout(() => setIsInefficient(false), 2000);
                }
                return newCount;
            });
            return;
        }

        // 入力を更新
        setCurrentCharInput(nextInput);
        setTotalCorrectChars(prev => prev + 1);
        setScore(prev => prev + 10);
        setFeedback({ type: 'correct', id: Date.now() });
        playSound('correct');

        // 完全一致の場合、次の文字へ
        if (exactMatches.length > 0) {
            const matchedRomaji = exactMatches[0];
            const newCompletedRomaji = completedRomaji + matchedRomaji;
            const nextCharIndex = currentCharIndex + 1;

            if (nextCharIndex >= currentWord.characters.length) {
                // 文章完了
                setTimeout(() => {
                    setCurrentWordIndex(prev => prev + 1);
                    setCurrentCharIndex(0);
                    setCurrentCharInput('');
                    setCompletedRomaji('');
                    setWordMistakes(0);
                    setIsInefficient(false);
                }, 200);
            } else {
                // 次の文字へ
                setCurrentCharIndex(nextCharIndex);
                setCurrentCharInput('');
                setCompletedRomaji(newCompletedRomaji);
            }
        }
    }, [gameState, currentChar, currentCharInput, completedRomaji, currentCharIndex, currentWord.characters, playSound]);

    const handleKeyDown = useCallback((e) => {
        if (gameState !== 'playing') return;
        if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            handleInput(e.key);
        }
    }, [handleInput, gameState]);

    return {
        gameState,
        timeLeft,
        score,
        currentWord: displayWord,
        userInput: completedRomaji + currentCharInput,
        wordMistakes,
        isInefficient,
        feedback,
        startGame,
        handleKeyDown
    };
};
