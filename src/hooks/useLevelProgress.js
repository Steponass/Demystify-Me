import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useGameStore from '@store/gameStore';

const useLevelProgress = (levelId, cloudConfigs = []) => {
  const navigate = useNavigate();

  const currentLevel = useGameStore(state => state.currentLevel);
  const isLevelUnlocked = useGameStore(state => state.isLevelUnlocked);
  const initializeClouds = useGameStore(state => state.initializeClouds);
  const advanceCloudLayer = useGameStore(state => state.advanceCloudLayer);
  const getCloudState = useGameStore(state => state.getCloudState);
  const isLevelCompletedBefore = useGameStore(state => state.isLevelCompletedBefore);
  const completeLevel = useGameStore(state => state.completeLevel);
  const isLevelCompleted = useGameStore(state => state.isLevelCompleted);
  const isCompleted = isLevelCompleted(levelId);

  const isUnlocked = isLevelUnlocked(levelId);
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

  // Call completeLevel when the level is completed for the first time
  useEffect(() => {
    if (isCompleted && !wasCompletedBefore) {
      completeLevel(levelId);
    }
  }, [isCompleted, wasCompletedBefore, levelId, completeLevel]);

  return {
    isUnlocked,
    isCompleted,
    wasCompletedBefore,

    getCloudState: (cloudId) => getCloudState(levelId, cloudId),
    advanceCloud: (cloudId) => advanceCloudLayer(levelId, cloudId),
  };
};

export default useLevelProgress;