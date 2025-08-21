import React, { useEffect, memo } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { getLevelComponent } from '@levels/levelRoutes';
import useGameStore from '@store/gameStore';
import GameGUI from '@components/ui/GameGUI/GameGUI';
import { setLevelGradient } from '@utils/backgroundGradient';
import styles from './LevelRouter.module.css';

const LevelContent = memo(({ levelId }) => {
  const [showHint, setShowHint] = React.useState(null);
  const LevelComponent = getLevelComponent(levelId);
  
  if (!LevelComponent) {
    return null;
  }
  
  return (
    <>
      <LevelComponent levelId={levelId} showHint={showHint} />
      <GameGUI levelId={levelId} onShowHint={setShowHint} />
    </>
  );
});

LevelContent.displayName = 'LevelContent';

const LevelRouter = () => {
  const { levelId } = useParams();
  const isLevelUnlocked = useGameStore(state => state.isLevelUnlocked);
  const currentLevel = useGameStore(state => state.currentLevel);
  const setZoomState = useGameStore(state => state.setZoomState);

  const numericLevelId = parseInt(levelId, 10);

  // Handle gradient and cleanup
  useEffect(() => {
    const isValidLevel = !isNaN(numericLevelId);
    if (isValidLevel) {
      setLevelGradient(numericLevelId);
    }
    
    return () => {
      document.body.classList.remove('cloud-zoomed');
      setZoomState(false);
    };
  }, [numericLevelId, setZoomState]);

  // Validation checks
  const isValid = !isNaN(numericLevelId);
  const isUnlocked = isValid && isLevelUnlocked(numericLevelId);

  if (!isValid || !isUnlocked) {
    const safeLevel = currentLevel > 0 ? currentLevel : 1;
    return <Navigate to={`/level/${safeLevel}`} replace />;
  }

  // Get the component to check if it exists
  const LevelComponent = getLevelComponent(numericLevelId);
  if (!LevelComponent) {
    return <Navigate to="/" replace />;
  }

  // Simple transition container with key for smooth re-renders
  return (
    <div 
      className={styles.levelContainer}
      key={numericLevelId}
    >
      <LevelContent levelId={numericLevelId} />
    </div>
  );
};

export default memo(LevelRouter);