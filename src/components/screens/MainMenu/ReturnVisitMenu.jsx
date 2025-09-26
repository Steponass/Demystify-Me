import React from "react";
import ActionButton from "@components/ui/ActionButton/ActionButton";
import ThresholdAdjuster from "@components/ui/ThresholdAdjuster/ThresholdAdjuster";
import { LEVEL_METADATA } from "./levelMetadata";
import styles from "./MainMenu.module.css";

const ReturnVisitMenu = ({ 
  currentLevel, 
  onResume, 
  tutorialCompleted, 
  onRetryTutorial 
}) => {
  const getLevelTitle = () => {
    const levelData = LEVEL_METADATA.find((level) => level.id === currentLevel);
    return levelData ? levelData.title : `Level ${currentLevel}`;
  };

  return (
    <div className={styles.menuContent}>
      <h1 className={styles.title}>Mystify Me</h1>
      <h5 className={styles.levelTitle}>{getLevelTitle()}</h5>

      <div className={styles.buttonContainer}>
        <ThresholdAdjuster />
        
        <ActionButton variant="primary" onClick={onResume}>
          Resume
        </ActionButton>
        
        {tutorialCompleted && (
          <ActionButton 
            variant="secondary" 
            onClick={onRetryTutorial}
            className={styles.tutorialButton}
          >
            Replay Tutorial
          </ActionButton>
        )}
      </div>
    </div>
  );
};

export default ReturnVisitMenu;