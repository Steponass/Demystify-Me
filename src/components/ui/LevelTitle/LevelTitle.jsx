import React, { useState, useEffect } from 'react';
import styles from './LevelTitle.module.css';

const LevelTitle = ({ levelId, levelTitle }) => {
  const [showDisplay, setShowDisplay] = useState(false);
  const [currentDisplayLevel, setCurrentDisplayLevel] = useState(null);

  useEffect(() => {
    if (levelId && levelId !== currentDisplayLevel) {
      setCurrentDisplayLevel(levelId);
      setShowDisplay(true);
      

      const timer = setTimeout(() => {
        setShowDisplay(false);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [levelId, currentDisplayLevel]);

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