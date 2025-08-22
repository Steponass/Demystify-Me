import React, { useState } from 'react';
import useGameStore from '@store/gameStore';
import InfoDialog from '@components/ui/InfoDialog/InfoDialog';
import styles from './ThresholdAdjuster.module.css';

const ThresholdAdjuster = () => {
  const { blowThreshold, setBlowThreshold } = useGameStore();
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);

  const thresholdOptions = [
    { value: 0.13, label: 'Most Sensitive' },
    { value: 0.2, label: 'More Sensitive' },
    { value: 0.28, label: 'Default' },
    { value: 0.45, label: 'Less Sensitive' },
    { value: 0.67, label: 'Least Sensitive' }
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

  const handleInfoClick = () => {
    setIsInfoDialogOpen(true);
  };

  const handleCloseInfoDialog = () => {
    setIsInfoDialogOpen(false);
  };

  return (
    <div className={styles.thresholdAdjuster}>
      <div className={styles.label}>
        <p>Microphone Sensitivity</p>
        <button 
          className={styles.thresholdAdjusterInfoBtn}
          onClick={handleInfoClick}
          aria-label="Adjusting microphone sensitivity"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
        </button>
      </div>
      
      <div className={styles.controls}>
        <button
          className={`${styles.controlsButton} ${styles.controlsButtonLeft} ${!canIncrease ? styles.disabled : ''}`}
          onClick={handleIncrease}
          disabled={!canIncrease}
          aria-label="Decrease sensitivity"
        >
          {/* https://iconsvg.xyz/ */}
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        
        <div className={styles.currentValue}>
          <p>{currentOption.label}</p>
        </div>
        
        <button 
          className={`${styles.controlsButton} ${styles.controlsButtonRight}  ${!canDecrease ? styles.disabled : ''}`}
          onClick={handleDecrease}
          disabled={!canDecrease}
          aria-label="Increase sensitivity"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>

      <InfoDialog
        isOpen={isInfoDialogOpen}
        title="Microphone Sensitivity"
        onClose={handleCloseInfoDialog}
      >
        <p>Blowing hard and still nothing? 
        <br></br> Adjust to More or Most Sensitive.</p>
        <p>Catching too much background noise?
        <br></br> Try Less or Least Sensitive</p>
      </InfoDialog>
    </div>
  );
};

export default ThresholdAdjuster;