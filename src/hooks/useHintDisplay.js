import { useEffect } from 'react';
import useGameStore from '@store/gameStore';
import useHintStore from '@store/hintStore';

const useHintDisplay = (levelId, cloudId, isZoomed, isRevealed) => {
  const getCloudState = useGameStore(state => state.getCloudState);
  const showCloudHint = useHintStore(state => state.showCloudHint);

  useEffect(() => {
    if (isZoomed && !isRevealed && cloudId && levelId !== undefined) {
      const cloudState = getCloudState(levelId, cloudId);
      
      if (cloudState?.cloudType && cloudState.cloudType !== 'B2') {
        const hintTimer = setTimeout(() => {
          showCloudHint(cloudState.cloudType);
        }, 800); // MUST BE longer than longest mic init delay (300ms)
        
        return () => clearTimeout(hintTimer);
      }
    }
  }, [isZoomed, isRevealed, cloudId, levelId, showCloudHint, getCloudState]);
};

export default useHintDisplay;