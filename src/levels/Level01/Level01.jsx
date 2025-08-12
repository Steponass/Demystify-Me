import React, { useRef, useEffect, useCallback } from 'react';
import Cloud from '@components/game/Cloud/Cloud';
import useLevelProgress from '@hooks/useLevelProgress';
import useCloudLayout from '@hooks/useCloudLayout';
import levelData from '@data/levels/level-01.json';

const Level01 = ({ levelId }) => {
  const containerRef = useRef(null);
  
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

  const handleZoomChange = useCallback((isZoomed) => {
    console.log(`Zoom state changed: ${isZoomed}`);
  }, []);

  return (
    <div>
      <h3>{levelData.title}</h3>
      <h5>Status: {isCompleted ? 'Completed' : 'In Progress'}</h5>
      
      <div 
        ref={containerRef}
        style={{ 
          position: 'relative',
          width: '100%',
          height: '90vh',

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
              levelId={levelId}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Level01;