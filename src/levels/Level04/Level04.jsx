import React from 'react';
import Cloud from '@components/game/Cloud/Cloud';
import useLevel from '@hooks/useLevel';
import levelData from '@data/levels/level-04.json';
import styles from '@levels/Level.module.css';

const Level04 = ({ levelId }) => {
  // Enhanced reveal handler for B1 clouds - tracks sequential completion
  const customHandleReveal = (cloudId) => {
    // eslint-disable-next-line no-unused-vars
    const revealedCloud = levelData.clouds.find(cloud => cloud.cloudId === cloudId);
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

export default Level04;