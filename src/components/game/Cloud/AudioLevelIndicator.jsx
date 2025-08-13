import React from 'react';
import styles from './AudioLevelIndicator.module.css';

const AudioLevelIndicator = ({ 
  audioLevel, 
  threshold = 0.28, 
  activeText = 'Mic active',
  inactiveText = 'Blow to reveal' 
}) => {
  const isActive = audioLevel > 0.05;
  const isAboveThreshold = audioLevel > threshold;
  
  return (
    <div className={styles.audioLevelContainer}>
      <div
        className={styles.audioLevelBar}
        style={{
          width: `${Math.min(audioLevel * 100, 100)}%`,
          backgroundColor: isAboveThreshold ? '#28a745' : '#007bff'
        }}
      />
      <span className={styles.audioLevelText}>
        {isActive ? activeText : inactiveText}
      </span>
    </div>
  );
};

export default AudioLevelIndicator;