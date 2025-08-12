import React, { useState, useRef, useEffect } from 'react';
import Cloud from '@components/game/Cloud/Cloud';
import useLevelProgress from '@hooks/useLevelProgress';
import useCloudLayout from '@hooks/useCloudLayout';
import levelData from '@data/levels/level-01.json';

const Level01 = ({ levelId }) => {
  const containerRef = useRef(null);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  
  const cloudConfigs = levelData.clouds.map(cloud => ({
    cloudId: cloud.cloudId,
    cloudType: cloud.cloudType
  }));

  const { isCompleted } = useLevelProgress(levelId, cloudConfigs);
  const { cloudPositions, updateContainerDimensions } = useCloudLayout(
    cloudConfigs.map(config => config.cloudId)
  );

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerDimensions({ width: rect.width, height: rect.height });
        updateContainerDimensions(rect.width, rect.height);
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [updateContainerDimensions]);

  const handleCloudReveal = (cloudId) => {
    console.log(`Cloud ${cloudId} revealed!`);
  };

  const handleZoomChange = (isZoomed) => {
    console.log(`Zoom state changed: ${isZoomed}`);
  };

  return (
    <div>
      <h1>{levelData.title}</h1>
      <p>Status: {isCompleted ? 'Completed' : 'In Progress'}</p>
      
      <div 
        ref={containerRef}
        style={{ 
          position: 'relative',
          width: '100%',
          height: '70vh',
          border: '2px dashed #ccc',
          marginTop: '2rem'
        }}
      >
        {levelData.clouds.map((cloudData) => {
          const position = cloudPositions[cloudData.cloudId];
          
          // Don't render until we have position data
          if (!position) return null;

          return (
            <Cloud
              key={cloudData.cloudId}
              cloudId={cloudData.cloudId}
              cloudType={cloudData.cloudType}
              position={position}
              content={cloudData.content}
              onReveal={handleCloudReveal}
              onZoomChange={handleZoomChange}
            />
          );
        })}
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f5f5f5' }}>
        <h3>Debug Info:</h3>
        <p>Container: {containerDimensions.width}x{containerDimensions.height}</p>
        <p>Positioned clouds: {Object.keys(cloudPositions).length}/{levelData.clouds.length}</p>
        <pre style={{ fontSize: '0.8rem' }}>
          {JSON.stringify(cloudPositions, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default Level01;