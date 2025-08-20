import React, { useState, useEffect } from "react";
import styles from "./LevelTitle.module.css";

const LevelTitle = ({ levelId, levelTitle }) => {
  const [showDisplay, setShowDisplay] = useState(false);

  useEffect(() => {
    if (levelId) {
      setShowDisplay(true);

      const timer = setTimeout(() => {
        setShowDisplay(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [levelId]);

  if (!showDisplay) {
    return null;
  }

  return (
    <div className={styles.levelDisplay}>
      <h1 className={styles.levelNumber}>Level {levelId}</h1>
      <h2 className={styles.levelTitle}>{levelTitle}</h2>
    </div>
  );
};

export default LevelTitle;
