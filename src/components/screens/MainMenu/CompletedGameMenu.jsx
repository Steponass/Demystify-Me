import React from 'react';
import { LEVEL_METADATA } from './levelMetadata';
import ActionButton from '@components/ui/ActionButton/ActionButton';
import ThresholdAdjuster from '@components/ui/ThresholdAdjuster/ThresholdAdjuster';
import styles from './MainMenu.module.css';

const CompletedGameMenu = ({ onLevelSelect, onStartFresh }) => {
  return (
    <div className={styles.menuContent}>
      <h1 className={styles.title}>Mystify Me</h1>
      
      <ThresholdAdjuster />
      
      <div className={styles.levelSelection}>
        {LEVEL_METADATA.map((level) => (
          <ActionButton
            key={level.title}
            className={styles.levelButton}
            onClick={() => onLevelSelect(level.path)}
            variant="level"
          >
            <p>{level.title}</p>
          </ActionButton>
        ))}
      </div>
      
      <div className={styles.freshStartContainer}>
        <ActionButton 
          variant="primary"
          onClick={onStartFresh}
        >
          Start Fresh
        </ActionButton>



      </div>
    </div>
  );
};

export default CompletedGameMenu;