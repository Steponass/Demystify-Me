import React from 'react';
import { useNavigate } from 'react-router-dom';
import useGameStore from '@store/gameStore';
import styles from './NextLevelButton.module.css';

const NextLevelButton = ({ levelId }) => {
  const navigate = useNavigate();
  const { isLevelUnlocked } = useGameStore();

  const handleNextLevel = () => {
    const nextLevelId = levelId + 1;

    // Check if next level exists and is unlocked
    if (nextLevelId <= 10 && isLevelUnlocked(nextLevelId)) {
      console.log(`Navigating to level ${nextLevelId}`);
      navigate(`/level/${nextLevelId}`);
    }
  };

  const nextLevelId = levelId + 1;
  const isNextLevelAvailable = nextLevelId <= 10 && isLevelUnlocked(nextLevelId);

  // Don't render button if there's no next level available
  if (!isNextLevelAvailable) {
    return null;
  }

  return (
    <button
      className={styles.nextLevelButton}
      onClick={handleNextLevel}
      aria-label="Go to next level"
    >
      Next Level
    </button>
  );
};

export default NextLevelButton;
