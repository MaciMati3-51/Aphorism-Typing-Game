import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAudio } from './useAudio';
import { APHORISMS } from '../data/usutakuData';
import { matchRomajiInput, normalizeRomaji, normalizeRomajiCandidates } from '../utils/romaji';

const GAME_DURATION = 60;
const MAX_WORD_MISTAKES = 3;

const convertAphorismsToGameData = (aphorisms) => {
    return aphorisms.map((item) => {
        const tokensString = item.tokens.join('|');
        const normalizedCandidates = normalizeRomajiCandidates(tokensString);

        return {
            id: item.id,
            original: item.original,
            expectedRaw: tokensString,
            expectedCandidatesRaw: item.tokens,
            expectedCandidatesNormalized: normalizedCandidates,
            displayRomaji: normalizedCandidates[0],
            tokens: normalizedCandidates
        };
    });
};

export const useGameLogic = () => {
    const [gameState, setGameState] = useState('idle');
    const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
    const [score, setScore] = useState(0);

    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [currentInput, setCurrentInput] = useState('');
    const [displayInput, setDisplayInput] = useState('');

    const [wordMistakes, setWordMistakes] = useState(0);
    const [isInefficient, setIsInefficient] = useState(false);

    const [totalCorrectChars, setTotalCorrectChars] = useState(0);
    const [totalMistakes, setTotalMistakes] = useState(0);

    const [feedback, setFeedback] = useState(null);
    const { playSound } = useAudio();

    const [aphorisms, setAphorisms] = useState([]);
    const [shuffledAphorisms, setShuffledAphorisms] = useState([]);
    const [activeRomaji, setActiveRomaji] = useState('');

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
                expectedRaw: '',
                expectedCandidatesNormalized: [],
                displayRomaji: '',
                tokens: []
            };
        }
        return rawWord;
    }, [rawWord]);

    useEffect(() => {
        setActiveRomaji(currentWord.displayRomaji || '');
    }, [currentWord.displayRomaji, currentWord.id]);

    const displayRomaji = activeRomaji || currentWord.displayRomaji || '';
    const displayWord = useMemo(() => ({
        ...currentWord,
        text: displayRomaji,
        tokens: displayRomaji ? [displayRomaji] : []
    }), [currentWord, displayRomaji]);

    const startGame = useCallback(() => {
        setGameState('playing');
        setTimeLeft(GAME_DURATION);
        startTimeRef.current = Date.now();
        setScore(0);
        setCurrentWordIndex(0);
        setCurrentInput('');
        setDisplayInput('');
        setActiveRomaji('');
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

    const startTimeRef = useRef(null);

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

    const handleInput = useCallback((char) => {
        if (gameState !== 'playing') return;
        const expectedCandidates = currentWord.expectedCandidatesNormalized || [];
        if (expectedCandidates.length === 0) return;

        const nextInput = currentInput + char;
        const normalizedCurrent = normalizeRomaji(currentInput);
        const normalizedNext = normalizeRomaji(nextInput);

        if (normalizedNext === normalizedCurrent) {
            setCurrentInput(nextInput);
            return;
        }

        const matchInfo = matchRomajiInput(expectedCandidates, nextInput);

        if (import.meta.env.DEV) {
            const resultLabel = matchInfo.isComplete
                ? 'complete OK'
                : matchInfo.isValid
                    ? 'prefix OK'
                    : `NG at ${matchInfo.ngIndex}`;
            console.debug('[typing-check]', {
                japanese: currentWord.original,
                expectedRaw: currentWord.expectedRaw,
                expectedNormalized: expectedCandidates,
                expectedUsed: matchInfo.matchedCandidate,
                typedRaw: nextInput,
                typedNormalized: matchInfo.normalizedTyped,
                result: resultLabel
            });
        }

        if (!matchInfo.isValid) {
            setTotalMistakes(prev => prev + 1);
            setScore(prev => Math.max(0, prev - 100));
            setFeedback({ type: 'mistake', id: Date.now() });
            playSound('mistake');

            setWordMistakes(prev => {
                const newCount = prev + 1;
                if (newCount === MAX_WORD_MISTAKES) {
                    setIsInefficient(true);
                    playSound('inefficient');
                    setTimeout(() => setIsInefficient(false), 2000);
                }
                return newCount;
            });
            return;
        }

        const delta = normalizedNext.length - normalizedCurrent.length;
        if (delta <= 0) {
            setCurrentInput(nextInput);
            return;
        }

        setCurrentInput(nextInput);
        setDisplayInput(matchInfo.matchedCandidate.slice(0, matchInfo.matchedLength));
        setActiveRomaji(matchInfo.matchedCandidate);
        setTotalCorrectChars(prev => prev + delta);
        setScore(prev => prev + (10 * delta));
        setFeedback({ type: 'correct', id: Date.now() });
        playSound('correct');

        if (matchInfo.isComplete) {
            setTimeout(() => {
                setCurrentWordIndex(prev => prev + 1);
                setCurrentInput('');
                setDisplayInput('');
                setActiveRomaji('');
                setWordMistakes(0);
                setIsInefficient(false);
            }, 200);
        }
    }, [gameState, currentWord.expectedCandidatesNormalized, currentWord.expectedRaw, currentWord.original, currentInput, playSound]);

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
        userInput: displayInput,
        wordMistakes,
        isInefficient,
        feedback,
        startGame,
        handleKeyDown
    };
};
