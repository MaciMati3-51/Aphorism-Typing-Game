import React from 'react';

// Left Bar: Points (accumulates) - Let's arbitrarliy max it out for visual or just show progress
// Right Bar: Accuracy (resets per word). 3 mistakes = 0.
const MAX_MISTAKES = 3;

export const HUD = ({ timeLeft, score, wordMistakes }) => {
    // Right bar calculation
    // 0 mistakes = 100%
    // 1 mistake = 66%
    // 2 mistakes = 33%
    // 3 mistakes = 0%
    const accuracyPercentage = Math.max(0, (MAX_MISTAKES - wordMistakes) / MAX_MISTAKES) * 100;

    // Left bar: Maybe just visualize score? Or "Progress to next level"?
    // Instructions say: "Points... accumulates... determines ending".
    // Let's make it fill up to a certain threshold (e.g. 10,000 pts)
    const scorePercentage = Math.min(100, (score / 10000) * 100);

    return (
        <div className="hud-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>

            {/* Left: Score/Points */}
            <div className="bar-container left" style={{ width: '35%' }}>
                <div className="bar-label">SCORE: {score}</div>
                <div className="bar-bg" style={{ height: '20px', background: '#333', borderRadius: '4px', overflow: 'hidden' }}>
                    <div className="bar-fill" style={{ width: `${scorePercentage}%`, height: '100%', background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)', transition: 'width 0.3s' }}></div>
                </div>
            </div>

            {/* Center: Timer */}
            <div className="timer" style={{ fontSize: '2.5rem', fontWeight: 'bold', fontFamily: 'monospace', color: timeLeft < 10 ? '#ff4d4d' : 'white' }}>
                0:{timeLeft.toString().padStart(2, '0')}
            </div>

            {/* Right: Accuracy/Efficiency */}
            <div className="bar-container right" style={{ width: '35%' }}>
                <div className="bar-label" style={{ textAlign: 'right' }}>EFFICIENCY</div>
                <div className="bar-bg" style={{ height: '20px', background: '#333', borderRadius: '4px', overflow: 'hidden' }}>
                    <div className="bar-fill" style={{ width: `${accuracyPercentage}%`, height: '100%', background: accuracyPercentage < 34 ? '#ff0000' : 'linear-gradient(90deg, #f093fb 0%, #f5576c 100%)', transition: 'width 0.2s', marginLeft: 'auto' }}></div>
                </div>
            </div>

        </div>
    );
};
