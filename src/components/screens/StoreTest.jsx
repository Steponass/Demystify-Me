import React from 'react';
import useGameStore from '@store/gameStore';

const StoreTest = () => {
  const { 
    currentLevel, 
    completedLevels,
    setCurrentLevel,
    completeLevel,
    resetAllProgress,
    isLevelUnlocked
  } = useGameStore();
  
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Game Store Test</h1>
      
      <div>
        <h2>Current State</h2>
        <p>Current Level: {currentLevel}</p>
        <p>Completed Levels: {completedLevels.join(', ') || 'None'}</p>
      </div>
      
      <div style={{ marginTop: '2rem' }}>
        <h2>Level Status</h2>
        {[0, 1, 2, 3, 4, 5].map((level) => (
          <div key={level} style={{ margin: '0.5rem 0' }}>
            Level {level}: {isLevelUnlocked(level) ? 'Unlocked' : 'Locked'}
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: '2rem' }}>
        <h2>Actions</h2>
        <button 
          onClick={() => completeLevel(0)} 
          style={{ margin: '0.5rem' }}
        >
          Complete Tutorial
        </button>
        
        <button 
          onClick={() => completeLevel(1)} 
          style={{ margin: '0.5rem' }}
        >
          Complete Level 1
        </button>
        
        <button 
          onClick={() => setCurrentLevel(2)} 
          style={{ margin: '0.5rem' }}
        >
          Set Current Level to 2
        </button>
        
        <button 
          onClick={resetAllProgress} 
          style={{ margin: '0.5rem', backgroundColor: '#ff4d4d' }}
        >
          Reset All Progress
        </button>
      </div>
    </div>
  );
};

export default StoreTest;