import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useGameStore from '@store/gameStore';

/**
 * @param {number} levelId - The current level ID
 * @param {Array} cloudIds - Array of cloud IDs in this level
 */

const useLevelProgress = (levelId, cloudIds = []) => {
  const navigate = useNavigate();
  
  const { 
    currentLevel,
    completedLevels, 
    revealedClouds,
    isLevelUnlocked,
    completeLevel,
    revealCloud,
    isCloudRevealed
  } = useGameStore();
  
  // Get revealed clouds for this level
  const levelRevealedClouds = revealedClouds[levelId] || [];
  
  // Check if level is unlocked
  const isUnlocked = isLevelUnlocked(levelId);
  
  // Check if all clouds in this level are revealed
  const isCompleted = cloudIds.length > 0 && 
    cloudIds.every(cloudId => levelRevealedClouds.includes(cloudId));
  
  // Protect route - redirect if level is not unlocked
  useEffect(() => {
    if (!isUnlocked && levelId !== 0) {
      // Redirect to the highest unlocked level
      navigate(`/level/${currentLevel}`);
    }
  }, [isUnlocked, levelId, navigate, currentLevel]);
  
  // Auto-complete level when all clouds are revealed
  useEffect(() => {
    if (isCompleted && !completedLevels.includes(levelId)) {
      completeLevel(levelId);
    }
  }, [isCompleted, levelId, completedLevels, completeLevel]);
  
  return {
    isUnlocked,
    isCompleted,
    revealedClouds: levelRevealedClouds,
    
    // Helper to reveal a cloud and track it
    handleRevealCloud: (cloudId) => {
      revealCloud(levelId, cloudId);
    },
    
    // Check if a specific cloud is revealed
    isCloudRevealed: (cloudId) => isCloudRevealed(levelId, cloudId),
  };
};

export default useLevelProgress;