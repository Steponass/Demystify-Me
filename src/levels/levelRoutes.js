import { lazy } from 'react';

const Level01 = lazy(() => import('@levels/Level01/Level01'));
const Level02 = lazy(() => import('@levels/Level02/Level02'));
const Level03 = lazy(() => import('@levels/Level03/Level03'));
const Level04 = lazy(() => import('@levels/Level04/Level04'));
const Level05 = lazy(() => import('@levels/Level05/Level05'));
const Level06 = lazy(() => import('@levels/Level06/Level06'));
const Level07 = lazy(() => import('@levels/Level07/Level07'));
const Level08 = lazy(() => import('@levels/Level08/Level08'));
const Level09 = lazy(() => import('@levels/Level09/Level09'));
const Level10 = lazy(() => import('@levels/Level10/Level10'));

// Map level IDs to components
const levelComponents = {
  1: Level01,
  2: Level02,
  3: Level03,
  4: Level04,
  5: Level05,
  6: Level06,
  7: Level07,
  8: Level08,
  9: Level09,
  10: Level10,
};

// Helper to get component for a level ID
export const getLevelComponent = (levelId) => {
  const numericId = parseInt(levelId, 10);
  return levelComponents[numericId] || null;
};

export {  
  Level01, 
  Level02, 
  Level03,
  Level04,
  Level05,
  Level06,
  Level07,
  Level08,
  Level09,
  Level10,
};