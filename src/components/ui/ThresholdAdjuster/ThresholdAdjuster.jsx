import React from 'react';
import useGameStore from '@store/gameStore';
import styles from './ThresholdAdjuster.module.css';

const ThresholdAdjuster = () => {
  const { blowThreshold, setBlowThreshold } = useGameStore();

  const thresholdOptions = [
    { value: 0.11, label: 'Most Sensitive' },
    { value: 0.2, label: 'More Sensitive' },
    { value: 0.28, label: 'Default' },
    { value: 0.5, label: 'Less Sensitive' },
    { value: 0.7, label: 'Least Sensitive' }
  ];

  const currentIndex = thresholdOptions.findIndex(option => option.value === blowThreshold);
  const currentOption = thresholdOptions[currentIndex] || thresholdOptions[2];

  const handleDecrease = () => {
    const newIndex = Math.max(0, currentIndex - 1);
    setBlowThreshold(thresholdOptions[newIndex].value);
  };

  const handleIncrease = () => {
    const newIndex = Math.min(thresholdOptions.length - 1, currentIndex + 1);
    setBlowThreshold(thresholdOptions[newIndex].value);
  };

  const canDecrease = currentIndex > 0;
  const canIncrease = currentIndex < thresholdOptions.length - 1;

  return (
    <div className={styles.thresholdAdjuster}>
      <div className={styles.label}>
        Microphone Sensitivity
      </div>
      
      <div className={styles.controls}>
        <button 
          className={`${styles.arrow} ${!canDecrease ? styles.disabled : ''}`}
          onClick={handleDecrease}
          disabled={!canDecrease}
          aria-label="Decrease sensitivity"
        >
          {/* https://iconsvg.xyz/ */}
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        
        <div className={styles.currentValue}>
          <span>{currentOption.label}</span>
        </div>
        
        <button 
          className={`${styles.arrow} ${!canIncrease ? styles.disabled : ''}`}
          onClick={handleIncrease}
          disabled={!canIncrease}
          aria-label="Increase sensitivity"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
    </div>
  );
};

export default ThresholdAdjuster;