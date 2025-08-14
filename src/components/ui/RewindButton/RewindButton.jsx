import React from 'react';
import useGameStore from '@store/gameStore';
import styles from './RewindButton.module.css';
import RewindIcon from '@/assets/images/ui/RewindIcon';

const RewindButton = ({ levelId }) => {
  const { rewindLevel } = useGameStore();
  
  const handleRewind = () => {
    rewindLevel(levelId);
  };

  return (
    <button 
      className={styles.rewindButton} 
      onClick={handleRewind}
      aria-label="Reset level - replay all clouds"
    >
      {/* You can put your SVG icon here or use the ResetIcon component */}
      <RewindIcon />
    </button>
  );
};

export default RewindButton;