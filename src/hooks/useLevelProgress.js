import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useGameStore from '@store/gameStore';

const useLevelProgress = (levelId, cloudConfigs = []) => {
  const navigate = useNavigate();

  const {
    currentLevel,
    isLevelUnlocked,
    initializeClouds,
    advanceCloudLayer,
    getCloudState,
    isLevelCompleted,
    isLevelCompletedBefore
  } = useGameStore();

  const isUnlocked = isLevelUnlocked(levelId);
  const isCompleted = isLevelCompleted(levelId);
  const wasCompletedBefore = isLevelCompletedBefore(levelId);

  useEffect(() => {
    if (isUnlocked && cloudConfigs.length > 0) {
      initializeClouds(levelId, cloudConfigs);
    }
  }, [levelId, cloudConfigs, isUnlocked, initializeClouds]);

  // Protect route
  useEffect(() => {
    if (!isUnlocked && levelId !== 0) {
      navigate(`/level/${currentLevel}`);
    }
  }, [isUnlocked, levelId, navigate, currentLevel]);

  // Note: Auto-routing on level completion removed as requested

  return {
    isUnlocked,
    isCompleted,
    wasCompletedBefore,

    getCloudState: (cloudId) => getCloudState(levelId, cloudId),
    advanceCloud: (cloudId) => advanceCloudLayer(levelId, cloudId),
  };
}; export default useLevelProgress;