import React from 'react';
import { Navigate, Outlet, useParams } from 'react-router-dom';
import useGameStore from '@store/gameStore';

/*
 * Checks if the requested level is unlocked
 * Redirects to appropriate level if not
 */

const ProtectedLevelRoute = () => {
  const { levelId } = useParams();
  const { isLevelUnlocked, currentLevel } = useGameStore();

  // Convert to number (params are strings)
  const numericLevelId = parseInt(levelId, 10);

  // Check if level is valid and unlocked
  const isValid = !isNaN(numericLevelId) && numericLevelId > 0; // Never allow level 0 (tutorial)
  const isUnlocked = isValid && isLevelUnlocked(numericLevelId);

  if (!isValid) {
    // Invalid level ID - redirect to level 1 or current level (never tutorial)
    const safeLevel = currentLevel > 0 ? currentLevel : 1;
    return <Navigate to={`/level/${safeLevel}`} replace />;
  }

  if (!isUnlocked) {
    // Level not unlocked - redirect to the highest unlocked level (never tutorial)
    const safeLevel = currentLevel > 0 ? currentLevel : 1;
    return <Navigate to={`/level/${safeLevel}`} replace />;
  }

  // Level is valid and unlocked
  return <Outlet />;
};

export default ProtectedLevelRoute;