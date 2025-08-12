import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useGameStore from '@store/gameStore';

const useLevelProgress = (levelId, cloudConfigs = []) => {
  const navigate = useNavigate();
  
  const { 
    currentLevel,
    isLevelUnlocked,
    completeLevel,
    initializeClouds,
    advanceCloudLayer,
    getCloudState,
    isLevelCompleted
  } = useGameStore();
  
  const isUnlocked = isLevelUnlocked(levelId);
  const isCompleted = isLevelCompleted(levelId);
  
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
  
  // Auto-complete level
  useEffect(() => {
    if (isCompleted) {
      completeLevel(levelId);
    }
  }, [isCompleted, levelId, completeLevel]);
  
  return {
    isUnlocked,
    isCompleted,
    
    getCloudState: (cloudId) => getCloudState(levelId, cloudId),
    advanceCloud: (cloudId) => advanceCloudLayer(levelId, cloudId),
  };
};

export default useLevelProgress;