import React from 'react';

// Character Panel
export const CharacterPanel = () => {
    return (
        <div className="character-panel" style={{
            position: 'fixed',
            bottom: 0,
            right: '5%',
            width: 'auto',
            height: '80vh', /* Adjust based on image aspect ratio usually */
            pointerEvents: 'none', // Let clicks pass through
            zIndex: 0
        }}>
            <img
                src="/images/表示キャラクター.png"
                alt="Character"
                style={{
                    height: '100%',
                    width: 'auto',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))'
                }}
            />
        </div>
    );
};
