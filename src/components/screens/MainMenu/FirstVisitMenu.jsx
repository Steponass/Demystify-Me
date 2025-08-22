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

      <h6 className={styles.introText}>This experience makes fun of buzzwords, comfort phrases, and other clichés.</h6>
      <h6 className={styles.introText}>You will need to use your microphone. A lot. When prompted, allow access.</h6>

      <div className={styles.buttonContainerFirstVisit}>
        <ActionButton
          variant="primary"
          onClick={onStart}
        >
          Start
        </ActionButton>
      </div>
      <div className={styles.thresholdAdjusterFirstVisit}>
        <ThresholdAdjuster />
      </div>
    </div>
  );
};

export default FirstVisitMenu;