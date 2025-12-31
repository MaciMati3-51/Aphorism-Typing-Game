import { useEffect } from 'react';
import './App.css';
import { useGameLogic } from './hooks/useGameLogic';
import { HUD } from './components/HUD';
import { TypingDisplay } from './components/TypingDisplay';
import { CharacterPanel } from './components/CharacterPanel';

function App() {
    const {
        gameState,
        timeLeft,
        score,
        currentWord,
        userInput,
        wordMistakes,
        isInefficient,
        feedback,
        startGame,
        handleKeyDown
    } = useGameLogic();

    // Global key listener
    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return (
        <div className="game-container">
            {gameState === 'idle' && (
                <div className="start-screen">
                    <h1 className="title">usu打</h1>
                    <button style={{ fontSize: '2rem', marginTop: '2rem' }} onClick={startGame}>
                        START GAME
                    </button>
                </div>
            )}

            {gameState === 'playing' && (
                <>
                    <HUD timeLeft={timeLeft} score={score} wordMistakes={wordMistakes} />

                    <TypingDisplay
                        currentWord={currentWord}
                        userInput={userInput}
                        isInefficient={isInefficient}
                        feedback={feedback}
                    />

                    <CharacterPanel />
                </>
            )}

            {gameState === 'finished' && (
                <div className="result-screen">
                    <h2>MISSION COMPLETE</h2>
                    <div style={{ fontSize: '3rem', margin: '2rem 0' }}>FINAL SCORE: {score}</div>
                    <button onClick={startGame}>TRY AGAIN</button>
                </div>
            )}
        </div>
    );
}

export default App;
