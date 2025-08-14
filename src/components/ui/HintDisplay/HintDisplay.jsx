import React from 'react';
import styles from './HintDisplay.module.css';

const HintDisplay = ({ hint, isVisible }) => {
  if (!hint) return null;

  return (
    <div className={`${styles.hintContainer} ${isVisible ? styles.visible : styles.hidden}`}>
      <p>{hint}</p>
    </div>
  );
};

export default HintDisplay;