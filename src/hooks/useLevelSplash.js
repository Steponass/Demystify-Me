import { useState, useCallback } from 'react';

export const useLevelSplash = () => {
  const [splashState, setSplashState] = useState({
    isVisible: false,
    levelId: null,
    levelTitle: '',
    fadeType: 'in'
  });

  // Show the splash screen with the specified level info
  const showSplash = useCallback((levelId, levelTitle, fadeType = 'in') => {
    // Always set isVisible to false first to prevent duplicate animations
    setSplashState(prev => ({
      ...prev,
      isVisible: false
    }));

    // Small delay to ensure React re-renders before showing the splash again
    setTimeout(() => {
      setSplashState({
        isVisible: true,
        levelId,
        levelTitle,
        fadeType
      });
    }, 50);
  }, []);

  const hideSplash = useCallback(() => {
    setSplashState(prev => ({
      ...prev,
      isVisible: false
    }));
  }, []);

  const onFadeComplete = useCallback(() => {
    if (splashState.fadeType === 'out' || splashState.fadeType === 'through') {
      setSplashState(prev => ({
        ...prev,
        isVisible: false
      }));
    }
  }, [splashState.fadeType]);

  return {
    splashState,
    showSplash,
    hideSplash,
    onFadeComplete
  };
};

export default useLevelSplash;
