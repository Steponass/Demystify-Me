import React, { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useGameStore from '@store/gameStore';
import LevelSplash from '@components/screens/LevelSplash/LevelSplash';
import { LEVEL_METADATA } from '@components/screens/MainMenu/levelMetadata';
import useLevelSplash from '@hooks/useLevelSplash';

const LevelTransitionManager = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    isLevelTransitioning,
    setLevelTransitioning,
    currentLevel
  } = useGameStore();

  const {
    splashState,
    showSplash,
    showLevelTransition,
    onFadeComplete
  } = useLevelSplash();

  // Get current level from URL
  const getCurrentLevelFromPath = useCallback(() => {
    const match = location.pathname.match(/\/level\/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }, [location.pathname]);

  // Handle level transition when a level is completed
  useEffect(() => {
    if (isLevelTransitioning) {
      const nextLevel = currentLevel;
      const currentLevelFromPath = getCurrentLevelFromPath();

      // Check if there's a next level
      const nextLevelMetadata = LEVEL_METADATA.find(level => level.id === nextLevel);

      if (nextLevelMetadata && nextLevel <= 10) {
        const handleTransition = async () => {
          // Show transition splash
          await showLevelTransition(
            currentLevelFromPath,
            nextLevel,
            nextLevelMetadata.title
          );

          // Navigate to next level
          navigate(`/level/${nextLevel}`);

          // Clear transition state
          setLevelTransitioning(false);
        };

        handleTransition();
      } else {
        // No next level (game completed) - redirect to main menu
        const handleGameCompletion = async () => {
          // Show a special completion splash or just transition
          setTimeout(() => {
            navigate('/');
            setLevelTransitioning(false);
          }, 1000);
        };

        handleGameCompletion();
      }
    }
  }, [isLevelTransitioning, currentLevel, navigate, showLevelTransition, getCurrentLevelFromPath, setLevelTransitioning]);

  // Show splash when entering a new level (not during transition)
  useEffect(() => {
    const currentLevelId = getCurrentLevelFromPath();

    if (currentLevelId !== null && !isLevelTransitioning) {
      let levelMetadata;

      if (currentLevelId === 0) {
        levelMetadata = { id: 0, title: "Tutorial" };
      } else {
        levelMetadata = LEVEL_METADATA.find(level => level.id === currentLevelId);
      }

      if (levelMetadata) {
        // Show splash for 2 seconds when entering a level
        showSplash(levelMetadata.id, levelMetadata.title, 'through');
      }
    }
  }, [location.pathname, isLevelTransitioning, showSplash, getCurrentLevelFromPath]);

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

export default LevelTransitionManager;
