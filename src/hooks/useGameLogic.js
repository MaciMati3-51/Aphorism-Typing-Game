import { useState, useEffect, useCallback, useRef } from 'react';
import { APHORISMS } from '../data/usutakuData';
import { useAudio } from './useAudio';

const GAME_DURATION = 60;
const MAX_WORD_MISTAKES = 3;

// Flexible typing variants (Kunrei Target -> Accepted Inputs)
const VARIANTS = {
    'si': ['shi', 'ci'],
    'ti': ['chi'],
    'tu': ['tsu'],
    'hu': ['fu'],
    'zi': ['ji'],
    'sya': ['sha'],
    'syu': ['shu'],
    'syo': ['sho'],
    'tya': ['cha'],
    'tyu': ['chu'],
    'tyo': ['cho'],
    'zya': ['ja'],
    'zyu': ['ju'],
    'zyo': ['jo'],
    // Extended common mapping
    'la': ['xa'], 'li': ['xi'], 'lu': ['xu'], 'le': ['xe'], 'lo': ['xo'], // small kana
    'qa': ['kwa'], 'wa': ['ua'] // rarely need
};

export const useGameLogic = () => {
    const [gameState, setGameState] = useState('idle');
    const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
    const [score, setScore] = useState(0);

    // Current word state
    const [currentWordIndex, setCurrentWordIndex] = useState(0);

    // Token Logic
    const [currentTokenIndex, setCurrentTokenIndex] = useState(0);
    const [currentInputBuffer, setCurrentInputBuffer] = useState(''); // What user typed for current token

    // Display State (Canonical)
    const [userInput, setUserInput] = useState(''); // Constructed from completed tokens + buffer

    const [wordMistakes, setWordMistakes] = useState(0);
    const [isInefficient, setIsInefficient] = useState(false);

    // Analytics
    const [totalCorrectChars, setTotalCorrectChars] = useState(0);
    const [totalMistakes, setTotalMistakes] = useState(0);

    // Audio/Visual Feedback
    const [feedback, setFeedback] = useState(null);
    const { playSound } = useAudio();

    const [shuffledAphorisms, setShuffledAphorisms] = useState([]);

    useEffect(() => {
        setShuffledAphorisms([...APHORISMS].sort(() => 0.5 - Math.random()));
    }, []);

    const currentWord = shuffledAphorisms[currentWordIndex % shuffledAphorisms.length] || APHORISMS[0];

    const startGame = useCallback(() => {
        setGameState('playing');
        setTimeLeft(GAME_DURATION);
        startTimeRef.current = Date.now();
        setScore(0);
        setCurrentWordIndex(0);
        setCurrentTokenIndex(0);
        setCurrentInputBuffer('');
        setUserInput('');
        setWordMistakes(0);
        setIsInefficient(false);
        setTotalCorrectChars(0);
        setTotalMistakes(0);
        setShuffledAphorisms([...APHORISMS].sort(() => 0.5 - Math.random()));
    }, []);

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

        // Safety check if tokens missing (fallback to text split)
        const tokens = currentWord.tokens || currentWord.text.split('');
        const targetToken = tokens[currentTokenIndex];

        // If no more tokens, ignore (loop should have handled next word)
        if (!targetToken) return;

        const nextBuffer = currentInputBuffer + char;

        // Check Match
        let matchResult = 'mistake'; // 'mistake', 'prefix', 'complete'

        // 1. Exact Match logic
        if (targetToken === nextBuffer) {
            matchResult = 'complete';
        } else if (targetToken.startsWith(nextBuffer)) {
            matchResult = 'prefix';
        } else {
            // 2. Variant Match logic
            const variants = VARIANTS[targetToken] || [];
            // Check if nextBuffer matches any variant fully
            if (variants.includes(nextBuffer)) {
                matchResult = 'complete';
            }
            // Check if nextBuffer is valid prefix of any variant
            else if (variants.some(v => v.startsWith(nextBuffer))) {
                matchResult = 'prefix';
            }
        }

        if (matchResult !== 'mistake') {
            // Correct
            setCurrentInputBuffer(nextBuffer);

            // For display: if prefix, show what user typed? 
            // actually, requirement says "Default to shortest" which implies showing canonical often.
            // But usually typing games show exactly what you type until it converts.
            // Let's rely on standard: Show committed + buffer.
            // BUT `TypingDisplay` compares canonical text indices.
            // To make `TypingDisplay` work without rewriting it, `userInput` MUST match `currentWord.text` prefix.
            // So if I type "si" (variant), I should add "shi" (target) to `userInput` only when COMPLETE?
            // While typing "s", "shi" starts with "s". `userInput` can be ...+"s".
            // While typing "si", if I append "i"; `userInput` ...+"si". "si" != "shi".
            // `TypingDisplay` won't highlight "shi".
            //
            // FIX: We need separate display state or accept that TypingDisplay won't highlight perfectly for variants until complete.
            // If I stick to `userInput` ONLY updating on complete token?
            // User types "t". Display no change? That feels laggy.
            // User types "t". Display "t"? Target "chi". "chi" != "t".
            //
            // Compromise: Update `userInput` to be `completedTokens.join('') + nextBuffer`.
            // In `TypingDisplay`, handle logic:
            // The display logic compares `index < userInput.length`.
            // It assumes strict index mapping.
            // This is the flaw of simple TypingDisplay with flexible input.
            //
            // However, since "shortest" is requested, usually that means the Model Answer.
            // If I type "si", and checking against "shi".
            // I will just use sound feedback.
            // Visual feedback: I will update `userInput` to match `targetToken` prefix IF it matches standard.
            // If it matches variant, I might NOT update visual (or update with target prefix?)
            // If I type "t" (for chi), "chi" starts with "c". "t" != "c".
            // I can't visually verify "t" on "chi".
            // So I will only update canonical input when TOKEN IS COMPLETE.
            // This means letters appear in chunks. "ti" -> "chi" appears.
            // This is acceptable for a "Strict but Flexible" game.
            // Beep on every correct key. Visual update on token complete.

            setTotalCorrectChars(prev => prev + 1);
            setScore(prev => prev + 100);
            setFeedback({ type: 'correct', id: Date.now() });
            playSound('correct');

            if (matchResult === 'complete') {
                // Commit token
                const confirmedToken = targetToken; // Always commit the canonical token
                const newCommitted = userInput + confirmedToken; // This effectively pushes "shi" even if user typed "si"

                // Reset buffer
                setCurrentInputBuffer('');

                // Use a functional update that references previous state appropriately or just independent?
                // We need to be careful with `userInput` state being mixed.
                // Actually `userInput` here is the *Canonical* string for display.
                // We add `confirmedToken` to it.
                // But wait, `userInput` in logic previously was raw. 
                // We are CHANGING definitions. `userInput` is now "Progress on Text".

                setUserInput(prev => {
                    // We need to re-construct from tokens to be safe? 
                    // Or just append.
                    return prev + confirmedToken;
                });

                setCurrentTokenIndex(prev => prev + 1);

                // Check Word Complete
                if (currentTokenIndex + 1 >= tokens.length) {
                    // Next Word
                    setTimeout(() => {
                        setCurrentWordIndex(prev => prev + 1);
                        setCurrentTokenIndex(0);
                        setCurrentInputBuffer('');
                        setUserInput('');
                        setWordMistakes(0);
                        setIsInefficient(false);
                    }, 200);
                }
            } else {
                // Prefix match.
                // Do NOT update `userInput` (Canonical). 
                // So user hears "click" but sees no change on "chi" until they finish "ti"?
                // If "shi" vs "s"... "s" matches. We COULD show "s".
                // But mixing "s" then "h" then "i" is easier.
                // If "t" ... "t" doesn't match "c". so no show.
                // "ti" -> "chi" appears.
                // This is consistent.

                // Optimization: If `nextBuffer` is a valid prefix of `targetToken`, show it!
                if (targetToken.startsWith(nextBuffer)) {
                    setUserInput(prev => {
                        // We can't easily append to `userInput` because we track "Canonical Progress".
                        // If we append "s", then next time we append "shi", we must remove "s".
                        // Easier to separate: `committedInput` (full tokens) + `currentBuffer` (if matches).
                        // BUT `TypingDisplay` takes ONE string `userInput`.
                        //
                        // Let's modify the RETURN below to compose it.
                        return prev; // Don't update state, just derived?
                        // We can't derive in `return`, this is a hook.
                        //
                        // Let's keep `userInput` as "Canonical Full Tokens".
                        // And expose `currentInput` to the View which is `userInput + (targetToken.startsWith(buffer) ? buffer : '')`.
                        // This way "s" shows up. "t" does not (ghost typing).
                    });
                }
            }

        } else {
            // Mistake
            setTotalMistakes(prev => prev + 1);
            setScore(prev => Math.max(0, prev - 1000));
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
        }
    }, [gameState, currentWord, currentTokenIndex, currentInputBuffer, userInput, wordMistakes, playSound]);

    const handleKeyDown = useCallback((e) => {
        if (gameState !== 'playing') return;
        if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            handleInput(e.key);
        }
    }, [handleInput, gameState]);

    // Derived display input
    // If buffer matches prefix of target, show it. Else show nothing for buffer.
    const tokens = currentWord.tokens || currentWord.text.split('');
    const targetToken = tokens[currentTokenIndex] || '';
    const bufferDisplay = targetToken.startsWith(currentInputBuffer) ? currentInputBuffer : '';
    const displayInput = userInput + bufferDisplay;

    return {
        gameState,
        timeLeft,
        score,
        currentWord,
        userInput: displayInput, // Expose combined
        wordMistakes,
        isInefficient,
        feedback,
        startGame,
        handleKeyDown
    };
};
