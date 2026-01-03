import React from 'react';

// Character Panel - Full screen background
export const CharacterPanel = () => {
    return (
        <div className="character-panel" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            pointerEvents: 'none', // Let clicks pass through
            zIndex: 0
        }}>
            <img
                src="/背景.png"
                alt="Background"
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: 0.6
                }}
            />
        </div>
    );
};
