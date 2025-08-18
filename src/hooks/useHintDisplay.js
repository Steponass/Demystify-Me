import { useEffect } from 'react';
import useGameStore from '@store/gameStore';

const useHintDisplay = (levelId, cloudId, isZoomed, isRevealed) => {
  const { isHintVisible, hideHint, clearHint, showHint, getCloudState } = useGameStore();

useEffect(() => {
  if (isZoomed && !isRevealed && cloudId && levelId !== undefined) {
    const cloudState = getCloudState(levelId, cloudId);
    if (cloudState?.cloudType && cloudState.cloudType !== 'B2') {
      const hintTimer = setTimeout(() => {
        showHint(cloudState.cloudType);
      }, 800); // MUST BE longer than longest mic init delay (300ms)
      
      return () => clearTimeout(hintTimer);
    }
  }
}, [isZoomed, isRevealed, cloudId, levelId, showHint, getCloudState]);

  // Handle hiding hints after a duration
  useEffect(() => {
    if (!isHintVisible) return;

    const hideTimer = setTimeout(() => {
      hideHint();
    }, 5000);

    return () => clearTimeout(hideTimer);
  }, [isHintVisible, hideHint]);

  useEffect(() => {
    if (isHintVisible) return;

    const clearTimer = setTimeout(() => {
      clearHint();
    }, 300);

    return () => clearTimeout(clearTimer);
  }, [isHintVisible, clearHint]);
};

export default useHintDisplay;