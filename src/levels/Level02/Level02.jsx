
import React from 'react';
import useLevelProgress from '@hooks/useLevelProgress';

const Level02 = ({ levelId }) => {
  // Sample cloud IDs for this level
  const cloudIds = ['comfort1', 'comfort2', 'comfort3', 'comfort4', 'comfort5'];
  const { isCompleted, handleRevealCloud, isCloudRevealed } = useLevelProgress(levelId, cloudIds);
  
  return (
    <div>
      <h1>Level 2: Comfort Phrases</h1>
      <p>Status: {isCompleted ? 'Completed' : 'In Progress'}</p>
      
      <div style={{ marginTop: '2rem' }}>
        <h2>Clouds</h2>
        {cloudIds.map((cloudId) => (
          <div key={cloudId} style={{ margin: '1rem 0' }}>
            <p>Cloud {cloudId}: {isCloudRevealed(cloudId) ? 'Revealed' : 'Hidden'}</p>
            <button onClick={() => handleRevealCloud(cloudId)}>
              {isCloudRevealed(cloudId) ? 'Already Revealed' : 'Reveal Cloud'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Level02;