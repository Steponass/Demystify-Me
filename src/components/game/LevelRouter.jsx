import React, { useEffect, memo } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { getLevelComponent } from '@levels/levelRoutes';
import useGameStore from '@store/gameStore';
import GameGUI from '@components/ui/GameGUI/GameGUI';
import { setLevelGradient } from '@utils/backgroundGradient';

const LevelRouter = () => {
  const { levelId } = useParams();
  const isLevelUnlocked = useGameStore(state => state.isLevelUnlocked);
  const currentLevel = useGameStore(state => state.currentLevel);
  const setZoomState = useGameStore(state => state.setZoomState);
  const [showHint, setShowHint] = React.useState(null);

  // Convert to number (params are strings)
  const numericLevelId = parseInt(levelId, 10);

  // Set the gradient for the current level and cleanup zoom state
  useEffect(() => {
    if (!isNaN(numericLevelId)) {
      setLevelGradient(numericLevelId);
    }
    
    // Cleanup zoom state and DOM when level changes
    return () => {
      document.body.classList.remove('cloud-zoomed');
      setZoomState(false);
    };
  }, [numericLevelId, setZoomState]);

  // Check if level is valid and unlocked
  const isValid = !isNaN(numericLevelId);
  const isUnlocked = isValid && isLevelUnlocked(numericLevelId);

  if (!isValid || !isUnlocked) {
    // Invalid or locked level - redirect to current level
    const safeLevel = currentLevel > 0 ? currentLevel : 1;
    return <Navigate to={`/level/${safeLevel}`} replace />;
  }

  // Get the component for this level
  const LevelComponent = getLevelComponent(numericLevelId);

  // If component doesn't exist, redirect to home
  if (!LevelComponent) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <LevelComponent levelId={numericLevelId} showHint={showHint} />
      <GameGUI levelId={numericLevelId} onShowHint={setShowHint} />
    </>
  );
};

export default memo(LevelRouter);