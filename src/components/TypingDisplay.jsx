import React, { useEffect, useState } from 'react';
import './TypingDisplay.css';

export const TypingDisplay = ({ currentWord, userInput, isInefficient, feedback }) => {
    const { original, characters, completedRomaji, currentCharInput, pendingRomaji, currentCharIndex } = currentWord;
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

    // 日本語文字のハイライト表示用
    const renderJapaneseCharacters = () => {
        if (!characters || characters.length === 0) {
            return <span>{original}</span>;
        }

        return characters.map((charObj, index) => {
            let className = 'jp-char';
            let style = {};

            if (index < currentCharIndex) {
                // 完了した文字
                className += ' completed';
                style = {
                    color: '#4facfe',
                    textShadow: '0 0 10px #4facfe'
                };
            } else if (index === currentCharIndex) {
                // 現在入力中の文字
                className += ' active';
                style = {
                    color: '#fff',
                    textShadow: '0 0 15px #fff',
                    fontWeight: 'bold'
                };
            } else {
                // 未入力の文字
                className += ' pending';
                style = {
                    color: '#888'
                };
            }

            return (
                <span key={index} className={className} style={style}>
                    {charObj.char}
                </span>
            );
        });
    };

    // ローマ字表示（入力済み + 入力中 + 未入力）
    const renderRomajiDisplay = () => {
        return (
            <div className="romaji-display" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
                {/* 完了したローマ字 */}
                <span style={{
                    color: '#4facfe',
                    textShadow: '0 0 10px #4facfe'
                }}>
                    {completedRomaji || ''}
                </span>
                {/* 現在入力中のローマ字 */}
                <span style={{
                    color: '#fff',
                    textShadow: '0 0 15px #fff',
                    fontWeight: 'bold'
                }}>
                    {currentCharInput || ''}
                </span>
                {/* 未入力のローマ字 */}
                <span style={{
                    color: '#666'
                }}>
                    {pendingRomaji || ''}
                </span>
            </div>
        );
    };

    return (
        <div className="typing-display" style={{ position: 'relative', margin: '4rem 0', minHeight: '150px', zIndex: 10 }}>

            {/* Inefficient Alert - Large display on 3rd mistake */}
            {isInefficient && (
                <div style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: '#ff3333',
                    fontSize: '6rem',
                    fontWeight: 'bold',
                    textShadow: '0 0 30px rgba(255,0,0,0.8)',
                    animation: 'inefficientAlert 2s ease-out forwards',
                    zIndex: 1000,
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none'
                }}>
                    非効率
                </div>
            )}

            {/* Original Text (Kanji) - Large display without progress coloring */}
            <div className="original-text" style={{
                fontSize: '2.5rem',
                marginBottom: '0.5rem',
                fontWeight: 'bold',
                letterSpacing: '2px',
                color: '#fff',
                textShadow: '0 0 10px rgba(255,255,255,0.5)'
            }}>
                {original}
            </div>

            {/* Reading Text (Hiragana) with character highlighting */}
            <div className="reading-text" style={{
                fontSize: '1.5rem',
                marginBottom: '1rem',
                letterSpacing: '1px'
            }}>
                {renderJapaneseCharacters()}
            </div>

            {/* Romaji Text */}
            <div className="romaji-text" style={{
                fontSize: '2rem',
                fontFamily: 'monospace',
                letterSpacing: '2px',
                position: 'relative'
            }}>
                {renderRomajiDisplay()}
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
                        <span style={{ color: '#00ff00', fontSize: '1.5rem', fontWeight: 'bold', textShadow: '0 0 10px lime' }}>効率的</span>
                    ) : (
                        <span style={{ color: '#ff0000', fontSize: '1.5rem', fontWeight: 'bold', textShadow: '0 0 15px red' }}>非効率</span>
                    )}
                </div>
            ))}
        </div>
    );
};
