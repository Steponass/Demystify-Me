import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useGameStore from '@store/gameStore';
import styles from './NextLevelButton.module.css';

const NextLevelButton = ({ levelId }) => {
  const navigate = useNavigate();
  const buttonRef = useRef(null);
  const isLevelUnlocked = useGameStore(state => state.isLevelUnlocked);
  const isLevelCompleted = useGameStore(state => state.isLevelCompleted);
  const isCurrentLevelCompleted = isLevelCompleted(levelId);
  const isGameComplete = useGameStore(state => state.isGameComplete);
  const checkGameComplete = useGameStore(state => state.checkGameComplete);
  const getEndingSequenceState = useGameStore(state => state.getEndingSequenceState);
  const setEndingSequenceState = useGameStore(state => state.setEndingSequenceState);

  // Check if game should be complete on component mount
  useEffect(() => {
    checkGameComplete();
  }, [checkGameComplete]);

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

  const handleBonusLevel = () => {
    // Start the ending sequence and navigate to the special CompletedGameMenu
    setEndingSequenceState('sequence_active');
    navigate('/menu');
  };

  const nextLevelId = levelId + 1;
  const isNextLevelAvailable = nextLevelId <= 10 && isLevelUnlocked(nextLevelId);
  
  // Check if this is level 10 with bonus available
  const endingSequenceState = getEndingSequenceState();
  const isLevel10WithBonus = levelId === 10 && isCurrentLevelCompleted && endingSequenceState === 'bonus_available';
  
  // Determine button behavior
  const buttonText = isLevel10WithBonus ? "Bonus Level!" : "Next Level";
  const handleClick = isLevel10WithBonus ? handleBonusLevel : handleNextLevel;

  // Don't render button if game is complete or current level isn't completed
  // BUT do render for level 10 with bonus available
  if (!isCurrentLevelCompleted) {
    return null;
  }
  
  // Don't render if game is complete UNLESS this is the special level 10 bonus case
  if (isGameComplete && !isLevel10WithBonus) {
    return null;
  }
  
  // Don't render if no next level available AND not the special level 10 bonus case
  if (!isNextLevelAvailable && !isLevel10WithBonus) {
    return null;
  }

  


  return (
    <button
      ref={buttonRef}
      className={styles.nextLevelButton}
      onClick={handleClick}
      aria-label={isLevel10WithBonus ? "Go to bonus level" : "Go to next level"}
    >
      {buttonText}
    </button>
  );
};

export default NextLevelButton;