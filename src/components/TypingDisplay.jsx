import React, { useEffect, useState } from 'react';
import './TypingDisplay.css';

export const TypingDisplay = ({ currentWord, userInput, isInefficient, feedback }) => {
    const { text, original, tokens } = currentWord;
    const [effects, setEffects] = useState([]);

    // ローマ字を30字程度で改行する関数
    const breakIntoLines = (tokens) => {
        if (!tokens || tokens.length === 0) return [text];

        const lines = [];
        let currentLine = '';

        for (const token of tokens) {
            // 次のトークンを追加したら30文字を超えるか確認
            if (currentLine.length > 0 && currentLine.length + token.length > 30) {
                // 現在の行を確定して、新しい行を開始
                lines.push(currentLine);
                currentLine = token;
            } else {
                // 現在の行に追加
                currentLine += token;
            }
        }

        // 最後の行を追加
        if (currentLine.length > 0) {
            lines.push(currentLine);
        }

        return lines;
    };

    const romajiLines = breakIntoLines(tokens);

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
                    非効率！
                </div>
            )}

            {/* Original Text (Japanese) */}
            <div className="original-text" style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>
                {original}
            </div>

            {/* Romaji Text (Multiple Lines) */}
            <div className="romaji-text" style={{ fontSize: '2rem', fontFamily: 'monospace', letterSpacing: '2px', position: 'relative' }}>
                {romajiLines.map((line, lineIndex) => {
                    // この行の開始位置を計算
                    let lineStartPos = 0;
                    for (let i = 0; i < lineIndex; i++) {
                        lineStartPos += romajiLines[i].length;
                    }

                    return (
                        <div key={lineIndex} style={{ marginBottom: '0.5rem' }}>
                            {line.split('').map((char, charIndex) => {
                                const absoluteIndex = lineStartPos + charIndex;
                                let className = 'char';
                                if (absoluteIndex < userInput.length) {
                                    className += ' typed correct';
                                } else if (absoluteIndex === userInput.length) {
                                    className += ' active';
                                }
                                return (
                                    <span key={charIndex} className={className} style={{
                                        color: absoluteIndex < userInput.length ? '#4facfe' : '#666',
                                        textShadow: absoluteIndex < userInput.length ? '0 0 10px #4facfe' : 'none',
                                        transition: 'color 0.1s'
                                    }}>
                                        {char}
                                    </span>
                                );
                            })}
                        </div>
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
                        <span style={{ color: '#00ff00', fontSize: '1.5rem', fontWeight: 'bold', textShadow: '0 0 10px lime' }}>効率的！</span>
                    ) : (
                        <span style={{ color: '#ff0000', fontSize: '1.5rem', fontWeight: 'bold', textShadow: '0 0 15px red' }}>非効率！</span>
                    )}
                </div>
            ))}
        </div>
    );
};
