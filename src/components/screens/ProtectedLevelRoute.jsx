import React, { memo } from 'react';
import { Navigate, Outlet, useParams } from 'react-router-dom';
import useGameStore from '@store/gameStore';

/*
 * Checks if the requested level is unlocked
 * Redirects to appropriate level if not
 */

const ProtectedLevelRoute = () => {
  const { levelId } = useParams();
  const isLevelUnlocked = useGameStore(state => state.isLevelUnlocked);
  const currentLevel = useGameStore(state => state.currentLevel);

  // Convert to number (since the params are strings)
  const numericLevelId = parseInt(levelId, 10);

  const isValid = !isNaN(numericLevelId);
  const isUnlocked = isValid && isLevelUnlocked(numericLevelId);

  

  if (!isValid) {
    const safeLevel = currentLevel > 0 ? currentLevel : 1;
    return <Navigate to={`/level/${safeLevel}`} replace />;
  }
  if (!isUnlocked) {
    // Level not unlocked - redirect to the highest unlocked level
    const safeLevel = currentLevel > 0 ? currentLevel : 1;
    return <Navigate to={`/level/${safeLevel}`} replace />;
  }

  // Level is valid and unlocked
  return <Outlet />;
};

export default memo(ProtectedLevelRoute);