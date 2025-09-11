import React, { memo } from "react";
import useGameStore from "@store/gameStore";
import LevelTitle from "@components/ui/LevelTitle/LevelTitle";
import HintDisplay from "@components/ui/HintDisplay/HintDisplay";
import BlowIndicator from "@components/ui/BlowIndicator/BlowIndicator";
import styles from "./GameGUI.module.css";
import MenuButton from "@components/ui/MenuButton/MenuButton";
import RewindButton from "@components/ui/RewindButton/RewindButton";
import NextLevelButton from "@components/ui/NextLevelButton/NextLevelButton";
import { LEVEL_METADATA } from "@components/screens/MainMenu/levelMetadata";

const GameGUI = ({ levelId }) => {
  const isLevelCompleted = useGameStore((state) => state.isLevelCompleted);
  const isZoomed = useGameStore((state) => state.isZoomed);
  const getZoomedCloudState = useGameStore((state) => state.getZoomedCloudState);
  const isCompleted = isLevelCompleted(levelId);
  
  // Get the zoomed cloud state to check if it's revealed
  const zoomedCloudState = getZoomedCloudState(levelId);
  const shouldShowBlowIndicator = isZoomed && !zoomedCloudState?.isRevealed;

  // Get level metadata
  const levelMetadata = LEVEL_METADATA.find((level) => level.id === levelId);
  const levelTitle = levelMetadata ? levelMetadata.title : `Level ${levelId}`;

  return (
    <div className={styles.guiContainer}>
      <LevelTitle levelId={levelId} levelTitle={levelTitle} />

      <div className={styles.hintsSection}>
        <HintDisplay />
      </div>

      <div className={styles.controlsSection}>
        <MenuButton />
        <RewindButton levelId={levelId} />
      </div>

      {isCompleted && !isZoomed && <NextLevelButton levelId={levelId} />}

      {shouldShowBlowIndicator && (
        <div className={styles.blowIndicatorSection}>
          <BlowIndicator levelId={levelId} />
        </div>
      )}
    </div>
  );
};

export default memo(GameGUI);