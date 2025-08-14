import React from 'react';
import { useNavigate } from 'react-router-dom';
import useGameStore from '@store/gameStore';
import FirstVisitMenu from './FirstVisitMenu';
import ReturnVisitMenu from './ReturnVisitMenu';
import CompletedGameMenu from './CompletedGameMenu';
import { TOTAL_GAME_LEVELS } from './levelMetadata';
import styles from './MainMenu.module.css';

const MainMenu = () => {
  const navigate = useNavigate();

  const {
    currentLevel,
    completedLevels,
    resetAllProgress
  } = useGameStore();

  // Determine which menu state to show
  const hasStartedGame = completedLevels.length > 0 || currentLevel > 0;

  // Check if all 10 game levels are completed
  const hasCompletedGame = completedLevels.length >= TOTAL_GAME_LEVELS;

  const handleStartNewGame = () => {
    navigate('/level/1');
  };

  const handleResumeGame = () => {
    const destination = currentLevel === 0 ? '/tutorial' : `/level/${currentLevel}`;
    navigate(destination);
  };

  const handleStartOver = () => {
    resetAllProgress();
    navigate('/tutorial');
  };

  const handleLevelSelect = (levelPath) => {
    navigate(levelPath);
  };

  const handleStartFresh = () => {
    resetAllProgress();
    // Stay on the menu after resetting so user can see the change
  };

  // Determine which menu component to render
  let menuContent;

  if (hasCompletedGame) {
    menuContent = (
      <CompletedGameMenu
        onLevelSelect={handleLevelSelect}
        onStartFresh={handleStartFresh}
      />
    );
  } else if (hasStartedGame) {
    menuContent = (
      <ReturnVisitMenu
        currentLevel={currentLevel}
        onResume={handleResumeGame}
        onStartOver={handleStartOver}
      />
    );
  } else {
    menuContent = (
      <FirstVisitMenu
        onStart={handleStartNewGame}
      />
    );
  }

  return (
    <div className={styles.mainMenu}>
      <div className={styles.mainMenu_container}>
        {menuContent}
      </div>
    </div>
  );
};

export default MainMenu;