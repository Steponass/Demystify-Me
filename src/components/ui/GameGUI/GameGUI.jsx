import React from 'react';
import useGameStore from '@store/gameStore';
import HintDisplay from '@components/ui/HintDisplay/HintDisplay';
import styles from './GameGUI.module.css';
import MenuButton from '@components/ui/MenuButton/MenuButton';
import RewindButton from '@components/ui/RewindButton/RewindButton';
import NextLevelButton from '@components/ui/NextLevelButton/NextLevelButton';

const GameGUI = ({ levelId }) => {
  const { currentHint, isHintVisible, isLevelCompleted } = useGameStore();
  // Removed useHintDisplay() - now handled in individual cloud components

  const isCompleted = isLevelCompleted(levelId);

  return (
    <div className={styles.guiContainer}>
      <div className={styles.hintsSection}>
        <HintDisplay hint={currentHint} isVisible={isHintVisible} />
      </div>

      <div className={styles.controlsSection}>
        <MenuButton />

        {isCompleted && (
          <RewindButton levelId={levelId} />
        )}
      </div>

      {isCompleted && (
        <div className={styles.nextLevelSection}>
          <NextLevelButton levelId={levelId} />
        </div>
      )}
    </div>
  );
};

export default GameGUI;