// Direct imports for all level components
import Level01 from '@levels/Level01/Level01';
import Level02 from '@levels/Level02/Level02';
import Level03 from '@levels/Level03/Level03';
import Level04 from '@levels/Level04/Level04';
import Level05 from '@levels/Level05/Level05';
import Level06 from '@levels/Level06/Level06';
import Level07 from '@levels/Level07/Level07';
import Level08 from '@levels/Level08/Level08';
import Level09 from '@levels/Level09/Level09';
import Level10 from '@levels/Level10/Level10';

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

// Export individual components for backward compatibility
export { Level01, Level02, Level03, Level04, Level05, Level06, Level07, Level08, Level09, Level10 };