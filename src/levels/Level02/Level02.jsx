import React from 'react';
import Cloud from '@components/game/Cloud/Cloud';
import useLevel from '@hooks/useLevel';
import levelData from '@data/levels/level-02.json';
import styles from '@levels/Level.module.css';

const Level02 = ({ levelId }) => {
  // Custom reveal handler for Level 2
  const customHandleReveal = (cloudId) => {
    console.log(`Cloud ${cloudId} revealed in Level 2!`);
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

      <div className={styles.cloud_layout} ref={containerRef}>
        {level.clouds.map((cloudData) => {
          const position = cloudPositions[cloudData.cloudId];

          // Don't render clouds until positioning is calculated
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

export default Level02;