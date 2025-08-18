import React from 'react';
import ActionButton from '@components/ui/ActionButton/ActionButton';
import ThresholdAdjuster from '@components/ui/ThresholdAdjuster/ThresholdAdjuster';
import styles from './MainMenu.module.css';

const ReturnVisitMenu = ({ currentLevel, onResume }) => {
  const getLevelText = () => {
    return `Level ${currentLevel}`;
  };

  return (
    <div className={styles.menuContent}>
      <h1 className={styles.title}>Mystify Me</h1>
      <h6 className={styles.subtitle}>Welcome back!</h6>
      
      <div className={styles.currentProgress}>
        <p>Current progress: {getLevelText()}</p>
      </div>
      

      
      <div className={styles.buttonContainer}>
        <ActionButton 
          variant="primary"
          onClick={onResume}
        >
          Resume
        </ActionButton>
        <ThresholdAdjuster />
      </div>
    </div>
  );
};

export default ReturnVisitMenu;