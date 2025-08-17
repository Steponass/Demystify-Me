import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useGameStore from '@store/gameStore';
import styles from './NextLevelButton.module.css';

const NextLevelButton = ({ levelId }) => {
  const navigate = useNavigate();
  const buttonRef = useRef(null);
  const { isLevelUnlocked } = useGameStore();

  useEffect(() => {
    const button = buttonRef.current;
    if (button) {
      // Generate random values between 300-500px
      const randomY = Math.floor(Math.random() * 801) - 400; // -400 to 400
      const randomX = Math.floor(Math.random() * 801) - 400; // -400 to 400
      const randomActiveY = Math.floor(Math.random() * 401) - 200; // -200 to 200

      button.style.setProperty('--random-y', `${randomY}px`);
      button.style.setProperty('--random-x', `${randomX}px`);
      button.style.setProperty('--random-active-y', `${randomActiveY}px`);
    }
  }, []);

  const handleNextLevel = () => {
    const nextLevelId = levelId + 1;

    // Check if next level exists and is unlocked
    if (nextLevelId <= 10 && isLevelUnlocked(nextLevelId)) {
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
      ref={buttonRef}
      className={styles.nextLevelButton}
      onClick={handleNextLevel}
      aria-label="Go to next level"
    >
      Next Level
    </button>
  );
};

export default NextLevelButton;