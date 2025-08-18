import React from 'react';
import ActionButton from '@components/ui/ActionButton/ActionButton';
import ThresholdAdjuster from '@components/ui/ThresholdAdjuster/ThresholdAdjuster';
import styles from './MainMenu.module.css';

const FirstVisitMenu = ({ onStart }) => {
  return (
    <div className={styles.menuContent}>
      <h1 className={styles.title}>Mystify Me</h1>
      
      <ThresholdAdjuster />
      
      <div className={styles.buttonContainer}>
        <ActionButton 
          variant="primary"
          onClick={onStart}
        >
          Start
        </ActionButton>
      </div>
    </div>
  );
};

export default FirstVisitMenu;