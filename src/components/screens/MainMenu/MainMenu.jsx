import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useGameStore from '@store/gameStore';
import FirstVisitMenu from './FirstVisitMenu';
import ReturnVisitMenu from './ReturnVisitMenu';
import CompletedGameMenu from './CompletedGameMenu';
import EndingSequenceMenu from './EndingSequenceMenu';
import ConfirmationDialog from '@components/ui/ConfirmationDialog/ConfirmationDialog';
import { TOTAL_GAME_LEVELS } from './levelMetadata';
import styles from './MainMenu.module.css';
import { setMenuGradient } from '@utils/backgroundGradient';

const MainMenu = () => {
  const navigate = useNavigate();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const {
    currentLevel,
    completedLevels,
    resetAllProgress,
    getEndingSequenceState,
  } = useGameStore();

  // Set menu gradient when MainMenu mounts
  useEffect(() => {
    setMenuGradient();
  }, []);

  // Determine which menu state to show
  const hasStartedGame = completedLevels.length > 0 || currentLevel > 0;

  // Check if all 10 game levels are completed
  const hasCompletedGame = completedLevels.length >= TOTAL_GAME_LEVELS;

  const handleStartNewGame = () => {
    navigate('/level/1');
  };

  const handleResumeGame = () => {
    const destination = currentLevel === 0 ? '/level/1' : `/level/${currentLevel}`;
    navigate(destination);
  };

  const handleStartOver = () => {
    resetAllProgress();
    navigate('/level/1');
  };

  const handleLevelSelect = (levelPath) => {
    navigate(levelPath);
  };

  const handleStartFresh = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmReset = () => {
    resetAllProgress();
    setShowConfirmDialog(false);
    // Stay on the menu after resetting so user can see the change
  };

  const handleCancelReset = () => {
    setShowConfirmDialog(false);
  };

  const handleEndingSequenceComplete = () => {
    // Ending sequence is complete, the store state is already updated
    // The component will re-render and show the normal CompletedGameMenu
  };

  // Determine which menu component to render
  let menuContent;
  
  // Check if we should show the ending sequence
  const endingSequenceState = getEndingSequenceState();
  
  if (endingSequenceState === 'sequence_active') {
    menuContent = (
      <EndingSequenceMenu
        onComplete={handleEndingSequenceComplete}
      />
    );
  } else if (hasCompletedGame) {
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

      <div className={styles.menuFog}>
        <img 
          src="/images/clouds/Wide_Fog.webp" 
          alt=""
          className={styles.fogImage}
        />
      </div>

      <div className={styles.mainMenu_container}>
        {menuContent}
      </div>
      
      <ConfirmationDialog
        isOpen={showConfirmDialog}
        title="Reset Game Progress"
        message="Sure you want to start again? This will reset all your progress."
        confirmText="Start Fresh"
        cancelText="Cancel"
        onConfirm={handleConfirmReset}
        onCancel={handleCancelReset}
      />
    </div>
  );
};

export default MainMenu;