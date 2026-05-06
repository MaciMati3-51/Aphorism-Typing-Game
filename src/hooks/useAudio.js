import { useCallback, useRef, useEffect } from 'react';

// 音声ファイルのパスを相対パスで指定（ローカルHTMLファイルでも動作）
const SOUND_PATHS = {
    correct: './sounds/correct.mp3',
    mistake: './sounds/mistake.mp3',
    inefficient: './sounds/inefficient.mp3',
    sdgs: './sounds/SDGs.mp3',
    finish_godlike: './sounds/finish_godlike.mp3',
    finish_good: './sounds/finish_good.mp3',
    finish_bad: './sounds/finish_bad.mp3'
};

export const useAudio = () => {
    const soundsRef = useRef({});

    useEffect(() => {
        // 音声オブジェクトを初期化
        Object.entries(SOUND_PATHS).forEach(([key, path]) => {
            try {
                const audio = new Audio(path);
                audio.volume = 0.5;
                audio.load();
                soundsRef.current[key] = audio;
            } catch (e) {
                console.warn(`Failed to load audio: ${path}`, e);
            }
        });

        return () => {
            // クリーンアップ
            Object.values(soundsRef.current).forEach(audio => {
                audio.pause();
                audio.src = '';
            });
        };
    }, []);

    const playSound = useCallback((type) => {
        const sound = soundsRef.current[type];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(e => {
                if (e.name !== 'AbortError') {
                    // 音声ファイルが存在しない場合は警告を抑制
                    // console.warn(`Audio play failed for ${type}:`, e);
                }
            });
        }
    }, []);

    return { playSound };
};
