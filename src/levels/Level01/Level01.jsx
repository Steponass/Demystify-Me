import React, { useRef, useEffect, useCallback } from 'react';
import Cloud from '@components/game/Cloud/Cloud';
import useLevelProgress from '@hooks/useLevelProgress';
import useCloudLayout from '@hooks/useCloudLayout';
import levelData from '@data/levels/level-01.json';
import styles from '@levels/Level.module.css'

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

  // eslint-disable-next-line no-unused-vars
  const handleZoomChange = useCallback((isZoomed) => {
    // Only log when debugging is needed
    // console.log(`Zoom state changed: ${isZoomed}`);
  }, []);

  return (
    <main>
      <h6>{levelData.title}</h6>
      <p>Status: {isCompleted ? 'Completed' : 'In Progress'}</p>

      <div className={styles.cloud_layout}
        ref={containerRef}
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
    </main>
  );
};

export default Level01;