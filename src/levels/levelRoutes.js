import { lazy } from 'react';

const TutorialLevel = lazy(() => import('./Tutorial/TutorialLevel'));
const Level01 = lazy(() => import('./Level01/Level01'));
const Level02 = lazy(() => import('./Level02/Level02'));
// const Level03 = lazy(() => import('./Level02/Level03'));
// const Level04 = lazy(() => import('./Level02/Level04'));
// const Level05 = lazy(() => import('./Level02/Level05'));
// const Level06 = lazy(() => import('./Level02/Level06'));
// const Level07 = lazy(() => import('./Level02/Level07'));
// const Level08 = lazy(() => import('./Level02/Level08'));
// const Level09 = lazy(() => import('./Level02/Level09'));
// const Level10 = lazy(() => import('./Level02/Level10'));
// const Level11 = lazy(() => import('./Level02/Level11'));
// const Level12 = lazy(() => import('./Level02/Level12'));

// Map level IDs to components
const levelComponents = {
  0: TutorialLevel,
  1: Level01,
  2: Level02,
  // 3: Level03,
  // 4: Level04,
  // 5: Level05,
  // 6: Level06,
  // 7: Level07,
  // 8: Level08,
  // 9: Level09,
  // 10: Level10,
  // 11: Level11,
  // 12: Level12,
};

// Helper to get component for a level ID
export const getLevelComponent = (levelId) => {
  const numericId = parseInt(levelId, 10);
  return levelComponents[numericId] || null;
};

export {  
  TutorialLevel, 
  Level01, 
  Level02, 
  // Level03,
  // Level04,
  // Level05,
  // Level06,
  // Level07,
  // Level08,
  // Level09,
  // Level10,
  // Level11,
  // Level12
};