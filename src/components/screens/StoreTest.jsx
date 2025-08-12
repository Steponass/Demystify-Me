// src/components/screens/StoreTest.jsx
import React from 'react';
import useGameStore from '@store/gameStore';

const StoreTest = () => {
  const { 
    currentLevel, 
    completedLevels,
    cloudStates,
    setCurrentLevel,
    completeLevel,
    resetAllProgress,
    isLevelUnlocked,
    initializeClouds,
    advanceCloudLayer,
    getCloudState,
    isLevelCompleted
  } = useGameStore();
  
  // Sample cloud configs for testing
  const testCloudConfigs = [
    { cloudId: 'cloud1', cloudType: 'A1' },
    { cloudId: 'cloud2', cloudType: 'A1' },
    { cloudId: 'cloud3', cloudType: 'B1' }
  ];

  const initializeTestClouds = () => {
    initializeClouds(1, testCloudConfigs);
  };

  const advanceTestCloud = (cloudId) => {
    advanceCloudLayer(1, cloudId);
  };

  const getTestCloudState = (cloudId) => {
    return getCloudState(1, cloudId);
  };
  
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Game Store Test</h1>
      
      <div>
        <h2>Current State</h2>
        <p>Current Level: {currentLevel}</p>
        <p>Completed Levels: {completedLevels.join(', ') || 'None'}</p>
        <p>Level 1 Completed: {isLevelCompleted(1) ? 'Yes' : 'No'}</p>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2>Cloud States</h2>
        <pre style={{ background: '#f5f5f5', padding: '1rem', fontSize: '0.9rem' }}>
          {JSON.stringify(cloudStates, null, 2)}
        </pre>
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
        <h2>Cloud Management</h2>
        <button 
          onClick={initializeTestClouds}
          style={{ margin: '0.5rem', padding: '0.5rem 1rem' }}
        >
          Initialize Level 1 Clouds
        </button>

        <div style={{ marginTop: '1rem' }}>
          <h3>Cloud States (Level 1):</h3>
          {testCloudConfigs.map(({ cloudId, cloudType }) => {
            const cloudState = getTestCloudState(cloudId);
            return (
              <div key={cloudId} style={{ margin: '0.5rem 0', padding: '0.5rem', background: '#f9f9f9' }}>
                <p><strong>{cloudId}</strong> (Type: {cloudType})</p>
                {cloudState ? (
                  <>
                    <p>Layer: {cloudState.currentLayer} | Revealed: {cloudState.isRevealed ? 'Yes' : 'No'}</p>
                    <button 
                      onClick={() => advanceTestCloud(cloudId)}
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.9rem' }}
                      disabled={cloudState.isRevealed}
                    >
                      {cloudState.isRevealed ? 'Fully Revealed' : 'Advance Layer'}
                    </button>
                  </>
                ) : (
                  <p style={{ color: '#666' }}>Not initialized</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      <div style={{ marginTop: '2rem' }}>
        <h2>Original Actions</h2>
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
          style={{ margin: '0.5rem', backgroundColor: '#ff4d4d', color: 'white', border: 'none', padding: '0.5rem' }}
        >
          Reset All Progress
        </button>
      </div>
    </div>
  );
};

export default StoreTest;