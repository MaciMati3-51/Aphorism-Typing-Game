import { useCallback } from 'react';

// Placeholder for audio files. 
// In a real app, import these or use URLs.
// Audio files should be placed in public/sounds/
const SOUNDS = {
    correct: new Audio('/sounds/correct.mp3'),
    mistake: new Audio('/sounds/mistake.mp3'),
    inefficient: new Audio('/sounds/inefficient.mp3'),
    finish_godlike: new Audio('/sounds/finish_godlike.mp3'),
    finish_good: new Audio('/sounds/finish_good.mp3'),
    finish_bad: new Audio('/sounds/finish_bad.mp3')
};

// Preload sounds
Object.values(SOUNDS).forEach(audio => {
    audio.load();
    audio.volume = 0.5; // Default volume
});

export const useAudio = () => {
    const playSound = useCallback((type) => {
        // console.log(`[Audio] Playing sound: ${type}`);
        if (SOUNDS[type]) {
            const sound = SOUNDS[type];
            sound.currentTime = 0; // Reset to start
            sound.play().catch(e => {
                // Ignore AbortError which happens if played too fast
                if (e.name !== 'AbortError') {
                    console.warn(`Audio play failed for ${type}:`, e);
                }
            });
        }
    }, []);

    return { playSound };
};
