import React, { useRef, useEffect, useCallback } from 'react';
import Cloud from '@components/game/Cloud/Cloud';
import useLevelProgress from '@hooks/useLevelProgress';
import useCloudLayout from '@hooks/useCloudLayout';
import levelData from '@data/levels/level-07.json';
import styles from '@levels/Level.module.css';

const Level07 = ({ levelId }) => {
  const containerRef = useRef(null);

  const cloudConfigs = levelData.clouds.map(cloud => ({
    cloudId: cloud.cloudId,
    cloudType: cloud.cloudType
  }));

  useLevelProgress(levelId, cloudConfigs);

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

  const handleCloudReveal = useCallback((cloudId) => {
    const revealedCloud = levelData.clouds.find(cloud => cloud.cloudId === cloudId);
    console.log(`Level 7: ${revealedCloud?.cloudType} cloud "${cloudId}" revealed!`);

  }, []);

  return (
    <main>
      <div className={styles.cloud_layout} ref={containerRef}>
        {levelData.clouds.map((cloudData) => {
          const position = cloudPositions[cloudData.cloudId];

          if (!position) return null;

          return (
            <Cloud
              key={cloudData.cloudId}
              cloudId={cloudData.cloudId}
              cloudType={cloudData.cloudType}
              position={position}
              content={cloudData.content}
              onReveal={handleCloudReveal}
              levelId={levelId}
            />
          );
        })}
      </div>
    </main>
  );
};

export default Level07;