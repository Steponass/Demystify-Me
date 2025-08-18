import React from 'react';
import useGameStore from '@store/gameStore';
import styles from './ThresholdAdjuster.module.css';

const ThresholdAdjuster = () => {
  const { blowThreshold, setBlowThreshold } = useGameStore();

  const thresholdOptions = [
    { value: 0.2, label: 'Most Sensitive' },
    { value: 0.24, label: 'More Sensitive' },
    { value: 0.28, label: 'Default' },
    { value: 0.32, label: 'Less Sensitive' },
    { value: 0.36, label: 'Least Sensitive' }
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
        Sensitivity
      </div>
      
      <div className={styles.controls}>
        <button 
          className={`${styles.arrow} ${!canDecrease ? styles.disabled : ''}`}
          onClick={handleDecrease}
          disabled={!canDecrease}
          aria-label="Decrease sensitivity"
        >
          ←
        </button>
        
        <div className={styles.currentValue}>
          {currentOption.label}
        </div>
        
        <button 
          className={`${styles.arrow} ${!canIncrease ? styles.disabled : ''}`}
          onClick={handleIncrease}
          disabled={!canIncrease}
          aria-label="Increase sensitivity"
        >
          →
        </button>
      </div>
    </div>
  );
};

export default ThresholdAdjuster;