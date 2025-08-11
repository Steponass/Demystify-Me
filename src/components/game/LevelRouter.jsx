import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { getLevelComponent } from '@levels/levelRoutes';
import useGameStore from '@store/gameStore';

const LevelRouter = () => {
  const { levelId } = useParams();
  const { isLevelUnlocked, currentLevel } = useGameStore();
  
  // Convert to number (params are strings)
  const numericLevelId = parseInt(levelId, 10);
  
  // Check if level is valid and unlocked
  const isValid = !isNaN(numericLevelId) && numericLevelId >= 0;
  const isUnlocked = isValid && isLevelUnlocked(numericLevelId);
  
  if (!isValid || !isUnlocked) {
    // Invalid or locked level - redirect to current level
    return <Navigate to={`/level/${currentLevel}`} replace />;
  }
  
  // Get the component for this level
  const LevelComponent = getLevelComponent(numericLevelId);
  
  // If component doesn't exist, redirect to home
  if (!LevelComponent) {
    return <Navigate to="/" replace />;
  }
  
  return <LevelComponent levelId={numericLevelId} />;
};

export default LevelRouter;