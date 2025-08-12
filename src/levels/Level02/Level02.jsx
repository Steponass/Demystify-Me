import React from 'react';
import useLevelProgress from '@hooks/useLevelProgress';

const Level02 = ({ levelId }) => {
  // Mixed cloud configurations for testing A1 and A2 types
  const cloudConfigs = [
    { cloudId: 'comfort1', cloudType: 'A2' }, // Double blow type
    { cloudId: 'comfort2', cloudType: 'A1' }, // Single blow type
    { cloudId: 'comfort3', cloudType: 'A2' }, // Double blow type
    { cloudId: 'comfort4', cloudType: 'A1' }, // Single blow type
    { cloudId: 'comfort5', cloudType: 'B1' }  // Three layer type
  ];

  const { isCompleted, getCloudState, advanceCloud } = useLevelProgress(levelId, cloudConfigs);

  return (
    <div>
      <h1>Level 2: Comfort Phrases</h1>
      <p>Status: {isCompleted ? 'Completed' : 'In Progress'}</p>

      <div style={{ marginTop: '2rem' }}>
        <h2>Clouds (Mixed Types for Testing)</h2>
        {cloudConfigs.map(({ cloudId, cloudType }) => {
          const cloudState = getCloudState(cloudId);

          // Show expected behavior based on cloud type
          const getCloudTypeDescription = (type) => {
            switch (type) {
              case 'A1': return 'Single blow: Layer 1 → Layer 3 (2 layers total)';
              case 'A2': return 'Double blow: Layer 1 → Layer 3 (2 layers total, with fail animation)';
              case 'B1': return 'Two blows: Layer 1 → Layer 2 → Layer 3 (3 layers total)';
              default: return 'Unknown type';
            }
          };

          return (
            <div key={cloudId} style={{
              margin: '1rem 0',
              padding: '1rem',
              border: '2px solid #ccc',
              borderColor: cloudType === 'A1' ? '#4CAF50' :
                cloudType === 'A2' ? '#2196F3' :
                  cloudType === 'B1' ? '#FF9800' : '#ccc',
              borderRadius: '8px'
            }}>
              <p><strong>Cloud {cloudId}</strong></p>
              <p><strong>Type:</strong> {cloudType}</p>
              <p><em>{getCloudTypeDescription(cloudType)}</em></p>

              {cloudState ? (
                <>
                  <p><strong>Current Layer:</strong> {cloudState.currentLayer}/{cloudType.startsWith('B') ? '3' : '3 (skips 2)'}</p>
                  <p><strong>Progress:</strong> {
                    cloudState.currentLayer === 1 ? 'Initial state' :
                      cloudState.currentLayer === 2 ? 'Intermediate layer (B-type only)' :
                        'Final revelation'
                  }</p>

                  <button
                    onClick={() => advanceCloud(cloudId)}
                    disabled={cloudState.isRevealed}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: cloudState.isRevealed ? '#ccc' : '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: cloudState.isRevealed ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {cloudState.isRevealed ? 'Fully Revealed' :
                      cloudType.startsWith('A') ? 'Advance to Final Layer (3)' :
                        cloudState.currentLayer === 1 ? 'Advance to Layer 2' :
                          'Advance to Final Layer (3)'}
                  </button>
                </>
              ) : (
                <p style={{ color: '#666' }}>Loading cloud state...</p>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h3>Testing Instructions:</h3>
        <ul style={{ paddingLeft: '1.5rem' }}>
          <li><strong>A1 clouds</strong> (green border): Should advance directly from Layer 1 to Layer 3</li>
          <li><strong>A2 clouds</strong> (blue border): Will also advance Layer 1 → Layer 3, but in real game will require double blow</li>
          <li><strong>B1 clouds</strong> (orange border): Should advance Layer 1 → Layer 2 → Layer 3 (three-step process)</li>
        </ul>
      </div>
    </div>
  );
};

export default Level02;