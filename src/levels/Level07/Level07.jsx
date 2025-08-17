import React from 'react';
import Cloud from '@components/game/Cloud/Cloud';
import useLevel from '@hooks/useLevel';
import levelData from '@data/levels/level-07.json';
import styles from '@levels/Level.module.css';

const Level07 = ({ levelId }) => {
  const customHandleReveal = (cloudId) => {
    const revealedCloud = levelData.clouds.find(cloud => cloud.cloudId === cloudId);
    console.log(`Level 7: ${revealedCloud?.cloudType} cloud "${cloudId}" revealed!`);
  };

  const {
    containerRef,
    cloudRefs,
    cloudPositions,
    handleCloudReveal,
    levelData: level
  } = useLevel(levelId, levelData, customHandleReveal);

  return (
    <main>
      <div className={styles.cloud_layout}
        ref={containerRef}
      >
        {level.clouds.map((cloudData) => {
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
              levelId={levelId}
              containerRef={cloudRefs[cloudData.cloudId]}
            />
          );
        })}
      </div>
    </main>
  );
};

export default Level07;