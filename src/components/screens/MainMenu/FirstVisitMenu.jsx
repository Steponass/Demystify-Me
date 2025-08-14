import React from 'react';
import styles from './MainMenu.module.css';

const FirstVisitMenu = ({ onStart }) => {
  return (
    <div className={styles.menuContent}>
      <h1 className={styles.title}>Mystify Me</h1>
      
      <div className={styles.buttonContainer}>
        <button 
          className={`${styles.button} ${styles.primaryButton}`}
          onClick={onStart}
        >
          Start
        </button>
      </div>
    </div>
  );
};

export default FirstVisitMenu;