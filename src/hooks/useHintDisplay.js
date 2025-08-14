import { useEffect } from 'react';
import useGameStore from '@store/gameStore';

const useHintDisplay = (levelId, cloudId, isZoomed, isRevealed) => {
  const { isHintVisible, hideHint, clearHint, showHint, getCloudState } = useGameStore();

  // Show hint when cloud is zoomed and not revealed
  useEffect(() => {
    if (isZoomed && !isRevealed && cloudId && levelId !== undefined) {
      const cloudState = getCloudState(levelId, cloudId);
      if (cloudState?.cloudType) {
        showHint(cloudState.cloudType);
      }
    }
  }, [isZoomed, isRevealed, cloudId, levelId, showHint, getCloudState]);

  // Handle hiding hints after a duration
  useEffect(() => {
    if (!isHintVisible) return;

    const hideTimer = setTimeout(() => {
      hideHint();
    }, 4000);

    return () => clearTimeout(hideTimer);
  }, [isHintVisible, hideHint]);

  // Clear hint text after fade-out animation
  useEffect(() => {
    if (isHintVisible) return;

    const clearTimer = setTimeout(() => {
      clearHint();
    }, 300);

    return () => clearTimeout(clearTimer);
  }, [isHintVisible, clearHint]);
};

export default useHintDisplay;