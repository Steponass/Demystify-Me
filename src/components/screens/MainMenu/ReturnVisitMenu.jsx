import React from 'react';
import ActionButton from '@components/ui/ActionButton/ActionButton';
import styles from './MainMenu.module.css';

const ReturnVisitMenu = ({ currentLevel, onResume, onStartOver }) => {
  const getLevelText = () => {
    if (currentLevel === 0) {
      return 'Tutorial';
    }
    return `Level ${currentLevel}`;
  };

  return (
    <div className={styles.menuContent}>
      <h1 className={styles.title}>Mystify Me</h1>
      <hh6 className={styles.subtitle}>Welcome back!</hh6>
      
      <div className={styles.currentProgress}>
        Current progress: {getLevelText()}
      </div>
      
      <div className={styles.buttonContainer}>
        <ActionButton 
          variant="primary"
          onClick={onResume}
        >
          Resume
        </ActionButton>
        
        <ActionButton 
          variant="secondary"
          onClick={onStartOver}
        >
          Start again
        </ActionButton>
      </div>
    </div>
  );
};

export default ReturnVisitMenu;