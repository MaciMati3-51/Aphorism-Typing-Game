import React, { useEffect, useState } from 'react';
import './TypingDisplay.css';

export const TypingDisplay = ({ currentWord, userInput, isInefficient, feedback }) => {
    const { text, original } = currentWord;
    const [effects, setEffects] = useState([]);

    useEffect(() => {
        if (feedback) {
            const id = feedback.id;
            const type = feedback.type;
            setEffects(prev => [...prev, { id, type }]);

            // Cleanup effect after animation
            setTimeout(() => {
                setEffects(prev => prev.filter(e => e.id !== id));
            }, 600);
        }
    }, [feedback]);

    return (
        <div className="typing-display" style={{ position: 'relative', margin: '4rem 0', minHeight: '150px' }}>

            {/* Inefficient Alert - Top of container/screen */}
            {isInefficient && (
                <div style={{
                    position: 'absolute',
                    top: '-60px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    color: '#ff3333',
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    textShadow: '0 0 10px rgba(255,0,0,0.8)',
                    animation: 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
                    zIndex: 10,
                    whiteSpace: 'nowrap'
                }}>
                    ⚠️ INEFFICIENT! ⚠️
                </div>
            )}

            {/* Original Text (Japanese) */}
            <div className="original-text" style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>
                {original}
            </div>

            {/* Romaji Text */}
            <div className="romaji-text" style={{ fontSize: '2rem', fontFamily: 'monospace', letterSpacing: '2px', position: 'relative', display: 'inline-block' }}>
                {text.split('').map((char, index) => {
                    let className = 'char';
                    if (index < userInput.length) {
                        className += ' typed correct';
                    } else if (index === userInput.length) {
                        className += ' active';
                    }
                    return (
                        <span key={index} className={className} style={{
                            color: index < userInput.length ? '#4facfe' : '#666',
                            textShadow: index < userInput.length ? '0 0 10px #4facfe' : 'none',
                            transition: 'color 0.1s'
                        }}>
                            {char}
                        </span>
                    );
                })}
            </div>

            {/* Visual Effects Overlay */}
            {effects.map(effect => (
                <div key={effect.id} className={`effect-popup ${effect.type}`} style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                    animation: 'popup 0.5s ease-out forwards',
                    zIndex: 5
                }}>
                    {effect.type === 'correct' ? (
                        <span style={{ color: '#00ff00', fontSize: '1.5rem', fontWeight: 'bold', textShadow: '0 0 10px lime' }}>CORRECT!</span>
                    ) : (
                        <span style={{ color: '#ff0000', fontSize: '2rem', fontWeight: 'bold', textShadow: '0 0 15px red' }}>MISTAKE!</span>
                    )}
                </div>
            ))}
        </div>
    );
};
