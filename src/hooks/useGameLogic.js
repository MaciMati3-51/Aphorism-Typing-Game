import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAudio } from './useAudio';
import { APHORISMS } from '../data/usutakuData';
import { createSession, typeKey, getView } from '../utils/typingEngine';

const GAME_DURATION = 60;
const MAX_WORD_MISTAKES = 3;

const EMPTY_SESSION = createSession('');

// 打てる文字が1つも無い文は出題しない（出題すると進行不能になる）
const WORDS = APHORISMS.filter((item) => !createSession(item.kana).done);

const shuffle = (items) => {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
};

export const useGameLogic = () => {
    const [gameState, setGameState] = useState('idle');
    const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
    const [score, setScore] = useState(0);

    const [currentWord, setCurrentWord] = useState(null);
    const [session, setSession] = useState(EMPTY_SESSION);

    const [wordMistakes, setWordMistakes] = useState(0);
    const [isInefficient, setIsInefficient] = useState(false);

    const [feedback, setFeedback] = useState(null);
    const { playSound } = useAudio();

    // 打鍵は描画を待たずに連続で届くので、判定に使う値は ref に持つ
    const poolRef = useRef(WORDS);
    const wordIndexRef = useRef(0);
    const sessionRef = useRef(EMPTY_SESSION);
    const wordMistakesRef = useRef(0);
    const startTimeRef = useRef(null);

    const loadWord = useCallback((index) => {
        const pool = poolRef.current;
        if (pool.length === 0) return;

        const word = pool[index % pool.length];
        const nextSession = createSession(word.kana);

        wordIndexRef.current = index;
        sessionRef.current = nextSession;
        wordMistakesRef.current = 0;

        setCurrentWord(word);
        setSession(nextSession);
        setWordMistakes(0);
        setIsInefficient(false);
    }, []);

    // 表示用データ（打ち方を切り替えるとローマ字ガイドも追従する）
    const displayWord = useMemo(() => {
        const view = getView(session);
        return {
            id: currentWord?.id ?? 0,
            original: currentWord?.original ?? '',
            characters: view.chars.map((char) => ({ char })),
            currentCharIndex: view.kanaDone,
            completedRomaji: view.completedRomaji,
            currentCharInput: view.currentInput,
            pendingRomaji: view.remaining
        };
    }, [session, currentWord]);

    const startGame = useCallback(() => {
        poolRef.current = shuffle(WORDS);
        startTimeRef.current = Date.now();
        setGameState('playing');
        setTimeLeft(GAME_DURATION);
        setScore(0);
        setFeedback(null);
        loadWord(0);
    }, [loadWord]);

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
     * 1打鍵の判定
     * 判定そのものは typingEngine が行う（どの打ち方にも合わなければミス）
     */
    const handleInput = useCallback((char) => {
        if (gameState !== 'playing') return;

        const current = sessionRef.current;
        if (current.done) return;

        const next = typeKey(current, char);

        if (!next) {
            // ミス
            setScore(prev => Math.max(0, prev - 100));
            setFeedback({ type: 'mistake', id: Date.now() });
            playSound('mistake');

            wordMistakesRef.current += 1;
            setWordMistakes(wordMistakesRef.current);
            if (wordMistakesRef.current === MAX_WORD_MISTAKES) {
                setIsInefficient(true);
                playSound('sdgs');
                setTimeout(() => setIsInefficient(false), 2000);
            }
            return;
        }

        setScore(prev => prev + 10);
        setFeedback({ type: 'correct', id: Date.now() });
        playSound('correct');

        if (next.done) {
            // 文章完了 → 待ち時間なしで次の文へ（待つと速い打鍵が取りこぼされてミスになる）
            loadWord(wordIndexRef.current + 1);
        } else {
            sessionRef.current = next;
            setSession(next);
        }
    }, [gameState, playSound, loadWord]);

    const handleKeyDown = useCallback((e) => {
        if (gameState !== 'playing') return;
        if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            // ' や / はブラウザのクイック検索、スペースはスクロールが動くので止める
            e.preventDefault();
            handleInput(e.key);
        }
    }, [handleInput, gameState]);

    return {
        gameState,
        timeLeft,
        score,
        currentWord: displayWord,
        userInput: displayWord.completedRomaji + displayWord.currentCharInput,
        wordMistakes,
        isInefficient,
        feedback,
        startGame,
        handleKeyDown
    };
};
