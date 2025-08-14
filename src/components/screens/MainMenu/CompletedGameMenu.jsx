import React from 'react';
import { LEVEL_METADATA } from './levelMetadata';
import styles from './MainMenu.module.css';

const CompletedGameMenu = ({ onLevelSelect, onStartFresh }) => {
  return (
    <div className={styles.menuContent}>
      <h1 className={styles.title}>Mystify Me</h1>
      <h6 className={styles.subtitle}>You've completed all the levels!</h6>
      
      <div className={styles.levelGrid}>
        {LEVEL_METADATA.map((level) => (
          <button
            key={level.id}
            className={`${styles.levelButton}`}
            onClick={() => onLevelSelect(level.path)}
          >
            <span className={styles.levelNumber}>Level {level.id}</span>
            <span className={styles.levelTitle}>{level.title}</span>
          </button>
        ))}
      </div>
      
      <div className={styles.freshStartContainer}>
        <button 
          className={`${styles.button} ${styles.tertiaryButton}`}
          onClick={onStartFresh}
        >
          Start Fresh
        </button>
      </div>
    </div>
  );
};

export default CompletedGameMenu;