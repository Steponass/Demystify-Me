import React from "react";
import ActionButton from "@components/ui/ActionButton/ActionButton";
import ThresholdAdjuster from "@components/ui/ThresholdAdjuster/ThresholdAdjuster";
import styles from "./MainMenu.module.css";

const ReturnVisitMenu = ({ currentLevel, onResume }) => {
  const getLevelText = () => {
    return `Level ${currentLevel}`;
  };

  return (
    <div className={styles.menuContent}>
      <h1 className={styles.title}>Mystify Me</h1>
      
      <ThresholdAdjuster />

      <div className={styles.currentProgress}>
        <h5>Current progress: {getLevelText()}</h5>
      </div>

      <div className={styles.buttonContainer}>
        <ActionButton variant="primary" onClick={onResume}>
          Resume
        </ActionButton>
      </div>
    </div>
  );
};

export default ReturnVisitMenu;
