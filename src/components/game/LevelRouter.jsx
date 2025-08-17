import React, { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { getLevelComponent } from '@levels/levelRoutes';
import useGameStore from '@store/gameStore';
import GameGUI from '@components/ui/GameGUI/GameGUI';
import { setLevelGradient } from '@utils/backgroundGradient';

const LevelRouter = () => {
  const { levelId } = useParams();
  const { isLevelUnlocked, currentLevel } = useGameStore();
  const [showHint, setShowHint] = React.useState(null);

  // Convert to number (params are strings)
  const numericLevelId = parseInt(levelId, 10);

  // Check if level is valid and unlocked
  const isValid = !isNaN(numericLevelId) && numericLevelId > 0; // Never allow level 0 (tutorial)
  const isUnlocked = isValid && isLevelUnlocked(numericLevelId);

  if (!isValid || !isUnlocked) {
    // Invalid or locked level - redirect to current level (never tutorial)
    const safeLevel = currentLevel > 0 ? currentLevel : 1;
    return <Navigate to={`/level/${safeLevel}`} replace />;
  }

  // Get the component for this level
  const LevelComponent = getLevelComponent(numericLevelId);

  // If component doesn't exist, redirect to home
  if (!LevelComponent) {
    return <Navigate to="/" replace />;
  }

  // Set the gradient for the current level
  useEffect(() => {
    setLevelGradient(numericLevelId);
  }, [numericLevelId]);

  return (
    <>
      <LevelComponent levelId={numericLevelId} showHint={showHint} />
      <GameGUI levelId={numericLevelId} onShowHint={setShowHint} />
    </>
  );
};

export default LevelRouter;