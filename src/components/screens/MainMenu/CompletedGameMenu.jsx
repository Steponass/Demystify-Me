import React from 'react';
import { LEVEL_METADATA } from './levelMetadata';
import ActionButton from '@components/ui/ActionButton/ActionButton';
import styles from './MainMenu.module.css';

const CompletedGameMenu = ({ onLevelSelect, onStartFresh }) => {
  return (
    <div className={styles.menuContent}>
      <h1 className={styles.title}>Mystify Me</h1>
      <h6 className={styles.subtitle}>You've completed all the levels!</h6>
      
      <div className={styles.levelSelection}>
        {LEVEL_METADATA.map((level) => (
          <ActionButton
            key={level.title}
            className={styles.levelButton}
            onClick={() => onLevelSelect(level.path)}
            variant="level"
          >
            <p className={styles.levelTitle}>{level.title}</p>
          </ActionButton>
        ))}
      </div>
      
      <div className={styles.freshStartContainer}>
        <ActionButton 
          variant="secondary"
          onClick={onStartFresh}
        >
          Start Fresh
        </ActionButton>
      </div>
    </div>
  );
};

export default CompletedGameMenu;