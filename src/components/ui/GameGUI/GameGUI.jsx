import React from 'react';
import useGameStore from '@store/gameStore';
import LevelTitle from '@components/ui/LevelTitle/LevelTitle';
import HintDisplay from '@components/ui/HintDisplay/HintDisplay';
import BlowIndicator from '@components/ui/BlowIndicator/BlowIndicator';
import styles from './GameGUI.module.css';
import MenuButton from '@components/ui/MenuButton/MenuButton';
import RewindButton from '@components/ui/RewindButton/RewindButton';
import NextLevelButton from '@components/ui/NextLevelButton/NextLevelButton';
import { LEVEL_METADATA } from '@components/screens/MainMenu/levelMetadata';

const GameGUI = ({ levelId }) => {
  const { currentHint, isHintVisible, isLevelCompleted, isZoomed, audioLevel } = useGameStore();

  const isCompleted = isLevelCompleted(levelId);

  // Get level metadata
  const levelMetadata = LEVEL_METADATA.find(level => level.id === levelId);
  const levelTitle = levelMetadata ? levelMetadata.title : `Level ${levelId}`;

  return (
    <div className={styles.guiContainer}>

      <LevelTitle levelId={levelId} levelTitle={levelTitle} />

      <div className={styles.hintsSection}>
        <HintDisplay hint={currentHint} isVisible={isHintVisible} />
      </div>

      <div className={styles.controlsSection}>
        <MenuButton />

        {isCompleted && (
          <RewindButton levelId={levelId} />
        )}
      </div>

      {isCompleted && !isZoomed && (
          <NextLevelButton levelId={levelId} />
      )}

      {isZoomed && (
        <div className={styles.blowIndicatorSection}>
          <BlowIndicator audioLevel={audioLevel} />
        </div>
      )}
    </div>
  );
};

export default GameGUI;