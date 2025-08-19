import React from 'react';
import ActionButton from '@components/ui/ActionButton/ActionButton';
import ThresholdAdjuster from '@components/ui/ThresholdAdjuster/ThresholdAdjuster';
import styles from './MainMenu.module.css';

const FirstVisitMenu = ({ onStart }) => {
  return (
    <div className={styles.menuContent}>
      <h1 className=
      {`${styles.titleFirstVisit} ${styles.title}`}
      
      > Mystify Me</h1>

      <h5 className={styles.triggerWarning}>Trigger warning: some of the content may upset you, particularly if you like living in denial </h5>
      
      <div className={styles.buttonContainer}>
        <ActionButton 
          variant="primary"
          onClick={onStart}
        >
          Start
        </ActionButton>
      </div>
      <ThresholdAdjuster />
    </div>
  );
};

export default FirstVisitMenu;