import { useEffect, useRef } from 'react';
import { MICROPHONE_START_DELAY } from '@components/game/Cloud/constants/cloudConstants';

const startBlowDetection = async (startListening) => {
  try {
    const success = await startListening();
    if (!success) {
      console.error('Failed to activate blow detection');
    }
    return success;
  } catch (error) {
    console.error('Error starting blow detection:', error);
    return false;
  }
};

export const useCloudMicrophone = (
  isZoomed, 
  isRevealed, 
  startListening, 
  stopListening
) => {
  const micTimeoutRef = useRef(null);

  useEffect(() => {
    if (micTimeoutRef.current) {
      clearTimeout(micTimeoutRef.current);
      micTimeoutRef.current = null;
    }

    const shouldListen = isZoomed && !isRevealed;

    if (shouldListen) {
      micTimeoutRef.current = setTimeout(() => {
        startBlowDetection(startListening);
        micTimeoutRef.current = null;
      }, MICROPHONE_START_DELAY);
    } else {
      stopListening();
    }

    return () => {
      if (micTimeoutRef.current) {
        clearTimeout(micTimeoutRef.current);
        micTimeoutRef.current = null;
      }
    };
  }, [isZoomed, isRevealed, startListening, stopListening]);
};