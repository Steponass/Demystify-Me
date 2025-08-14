import React, { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import LevelSplash from '@components/screens/LevelSplash/LevelSplash';
import { LEVEL_METADATA } from '@components/screens/MainMenu/levelMetadata';
import useLevelSplash from '@hooks/useLevelSplash';

const LevelSplashManager = ({ children }) => {
  const location = useLocation();

  const {
    splashState,
    showSplash,
    onFadeComplete
  } = useLevelSplash();

  // Get current level from URL
  const getCurrentLevelFromPath = useCallback(() => {
    const match = location.pathname.match(/\/level\/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }, [location.pathname]);

  useEffect(() => {
    const currentLevelId = getCurrentLevelFromPath();

    if (currentLevelId !== null) {
      let levelMetadata;

      if (currentLevelId === 0) {
        levelMetadata = { id: 0, title: "Tutorial" };
      } else {
        levelMetadata = LEVEL_METADATA.find(level => level.id === currentLevelId);
      }

      if (levelMetadata) {
        // Show splash when entering a level with a through animation (in then out)
        showSplash(levelMetadata.id, levelMetadata.title, 'through');
      }
    }
  }, [location.pathname, showSplash, getCurrentLevelFromPath]);

  return (
    <>
      {children}
      <LevelSplash
        levelId={splashState.levelId}
        levelTitle={splashState.levelTitle}
        isVisible={splashState.isVisible}
        fadeType={splashState.fadeType}
        onFadeComplete={onFadeComplete}
      />
    </>
  );
};

export default LevelSplashManager;
