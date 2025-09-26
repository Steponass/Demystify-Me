import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useGameStore from "@store/gameStore";
import FirstVisitMenu from "./FirstVisitMenu";
import ReturnVisitMenu from "./ReturnVisitMenu";
import CompletedGameMenu from "./CompletedGameMenu";
import EndingSequenceMenu from "./EndingSequenceMenu";
import ConfirmationDialog from "@components/ui/ConfirmationDialog/ConfirmationDialog";
import { TOTAL_GAME_LEVELS } from "./levelMetadata";
import styles from "./MainMenu.module.css";
import { setMenuGradient } from "@utils/backgroundGradient";

const MainMenu = () => {
  const navigate = useNavigate();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const {
    currentLevel,
    completedLevels,
    resetAllProgress,
    getEndingSequenceState,
    shouldShowTutorial,
    isTutorialCompleted,
    startTutorial,
  } = useGameStore();

  useEffect(() => {
    setMenuGradient();
  }, []);

  // getTutorialState removed to avoid unused variable
  const showTutorial = shouldShowTutorial();
  const tutorialCompleted = isTutorialCompleted();

  // Updated game state detection
  const hasStartedGame =
    tutorialCompleted && (completedLevels.length > 0 || currentLevel > 1);
  const hasCompletedGame = completedLevels.length >= TOTAL_GAME_LEVELS;

  const handleStartTutorial = () => {
    startTutorial();
    navigate("/tutorial");
  };

  const handleStartNewGame = () => {
    navigate("/level/1");
  };

  const handleResumeGame = () => {
    const destination =
      currentLevel === 0 ? "/level/1" : `/level/${currentLevel}`;
    navigate(destination);
  };

  const handleStartOver = () => {
    resetAllProgress();
    navigate("/level/1");
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
  };

  const handleCancelReset = () => {
    setShowConfirmDialog(false);
  };

  const handleEndingSequenceComplete = () => {
    // Ending sequence completion logic
  };

  // Determine which menu component to render
  let menuContent;

  // Check if we should show the ending sequence
  const endingSequenceState = getEndingSequenceState();

  if (endingSequenceState === "sequence_active") {
    menuContent = (
      <EndingSequenceMenu onComplete={handleEndingSequenceComplete} />
    );
  } else if (hasCompletedGame) {
    menuContent = (
      <CompletedGameMenu
        onLevelSelect={handleLevelSelect}
        onStartFresh={handleStartFresh}
      />
    );
  } else if (showTutorial) {
    // New users who haven't completed tutorial
    menuContent = <FirstVisitMenu onStartTutorial={handleStartTutorial} />;
  } else if (hasStartedGame) {
    // Returning users who have completed tutorial and started main game
    menuContent = (
      <ReturnVisitMenu
        currentLevel={currentLevel}
        onResume={handleResumeGame}
        onStartOver={handleStartOver}
        tutorialCompleted={tutorialCompleted}
        onRetryTutorial={handleStartTutorial}
      />
    );
  } else {
    // Edge case: tutorial completed but main game not started
    menuContent = <FirstVisitMenu onStartTutorial={handleStartNewGame} />;
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

      <div className={styles.mainMenu_container}>{menuContent}</div>

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
