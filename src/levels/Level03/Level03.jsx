import React, { memo, useState } from 'react';
import Cloud from '@components/game/Cloud/Cloud';
import useLevel from '@hooks/useLevel';
import levelData from '@data/levels/level-03.json';
import InfoDialog from '@components/ui/InfoDialog/InfoDialog';
import styles from '@levels/Level.module.css';

const Level03 = ({ levelId }) => {
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(true);

  const {
    containerRef,
    cloudRefs,
    cloudPositions,
    handleCloudReveal,
    levelData: level
  } = useLevel(levelId, levelData);

  const handleCloseInfoDialog = () => {
    setIsInfoDialogOpen(false);
  };

  return (
    <main>
      <div className={styles.cloud_layout}
        ref={containerRef}
      >
        {level.clouds.map((cloudData) => {
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
              containerRef={cloudRefs[cloudData.cloudId]}
            />
          );
        })}
      </div>

      <InfoDialog
        isOpen={isInfoDialogOpen}
        title="Autosave"
        onClose={handleCloseInfoDialog}
      >
        <p>Your progress is saved with each cloud you reveal, so you can come back any time.</p>
      </InfoDialog>
    </main>
  );
};

export default memo(Level03);