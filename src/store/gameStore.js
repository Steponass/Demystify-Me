import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const initialState = {
  currentLevel: 0,
  completedLevels: [],
  cloudStates: {},
  isLevelTransitioning: false,
  isZoomed: false,
  zoomedCloudId: null,
  audioLevel: 0,
  isGameComplete: false,
  endingSequenceState: 'not_started',
  blowThreshold: 0.28,
};

const useGameStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      setCurrentLevel: (level) => set({ currentLevel: level }),

      completeLevel: (levelId) => {
        const { completedLevels, currentLevel } = get();

        // Only update state if this is the first completion
        const isFirstTimeCompletion = !completedLevels.includes(levelId);

        if (isFirstTimeCompletion) {
          const newCurrentLevel = Math.max(currentLevel, levelId + 1);
          const newCompletedLevels = [...completedLevels, levelId];
          const isGameComplete = newCompletedLevels.length === 10;
          

          if (isGameComplete) {
            console.log('Game completed! All 10 levels finished.');
          }

          // Special handling for level 10 first completion
          const shouldTriggerEndingSequence = levelId === 10 && isFirstTimeCompletion;
          
          set({
            completedLevels: newCompletedLevels,
            currentLevel: newCurrentLevel,
            isGameComplete,
            endingSequenceState: shouldTriggerEndingSequence ? 'bonus_available' : get().endingSequenceState
          });
        }}, isLevelCompletedBefore: (levelId) => {
        const { completedLevels } = get();
        return completedLevels.includes(levelId);
      },

      // Check and update isGameComplete based on current completedLevels
      checkGameComplete: () => {
        const { completedLevels, isGameComplete } = get();
        const shouldBeComplete = completedLevels.length === 10;
        
        if (shouldBeComplete && !isGameComplete) {
          set({ isGameComplete: true });
        }
      },

    // Cloud instance-related states

      setZoomState: (isZoomed, cloudId = null) => {
        set({ 
          isZoomed,
          zoomedCloudId: isZoomed ? cloudId : null 
        });
      },

      getZoomedCloudState: (levelId) => {
        const { zoomedCloudId, cloudStates } = get();
        if (!zoomedCloudId || !cloudStates[levelId]) return null;
        return cloudStates[levelId][zoomedCloudId];
      },

      getZoomState: () => {
        return get().isZoomed;
      },

      setAudioLevel: (level) => {
        set({ audioLevel: level });
      },

      getAudioLevel: () => {
        return get().audioLevel;
      },

      setLevelTransitioning: (isTransitioning) => {
        set({ isLevelTransitioning: isTransitioning });
      },

      isLevelUnlocked: (levelId) => {
        const { completedLevels } = get();

        // Only Level 1 is always unlocked
        if (levelId === 1) {
          return true;
        }

        // Other levels require the previous level to be completed
        const isUnlocked = completedLevels.includes(levelId - 1);
        return isUnlocked;

      },

      initializeClouds: (levelId, cloudConfigs) => {
        const { cloudStates } = get();

        if (!cloudStates[levelId]) {
          const levelClouds = {};

          cloudConfigs.forEach(config => {
            levelClouds[config.cloudId] = {
              currentLayer: 1,
              isRevealed: false,
              cloudType: config.cloudType
            };
          });

          set({
            cloudStates: {
              ...cloudStates,
              [levelId]: levelClouds
            }
          });
        }
      },

      advanceCloudLayer: (levelId, cloudId) => {
        const { cloudStates } = get();
        const levelClouds = cloudStates[levelId] || {};
        const cloudState = levelClouds[cloudId];

        if (!cloudState) {
          return;
        }

        let newLayer;
        let isRevealed;

        if (cloudState.cloudType.startsWith('A')) {
          if (cloudState.currentLayer === 1) {
            newLayer = 3;
            isRevealed = true;
          } else {
            newLayer = cloudState.currentLayer;
            isRevealed = true;
          }
        } else if (cloudState.cloudType.startsWith('B')) {
          newLayer = cloudState.currentLayer + 1;
          isRevealed = newLayer === 3;
        } else {
          newLayer = cloudState.currentLayer + 1;
          isRevealed = newLayer >= 3;
        }

        set({
          cloudStates: {
            ...cloudStates,
            [levelId]: {
              ...levelClouds,
              [cloudId]: {
                ...cloudState,
                currentLayer: newLayer,
                isRevealed
              }
            }
          }
        });
      },

      getCloudState: (levelId, cloudId) => {
        const { cloudStates } = get();
        return cloudStates[levelId]?.[cloudId] || null;
      },

      isLevelCompleted: (levelId) => {
        const { cloudStates } = get();
        const levelClouds = cloudStates[levelId] || {};
        const cloudArray = Object.values(levelClouds);

        return cloudArray.length > 0 && cloudArray.every(cloud => cloud.isRevealed);
      },

      rewindLevel: (levelId) => {
        const { cloudStates } = get();
        const levelClouds = cloudStates[levelId];

        if (!levelClouds) {
          return;
        }

        const resetClouds = {};
        Object.keys(levelClouds).forEach(cloudId => {
          const cloudState = levelClouds[cloudId];
          resetClouds[cloudId] = {
            ...cloudState,
            currentLayer: 1,
            isRevealed: false
          };
        });

        set({
          cloudStates: {
            ...cloudStates,
            [levelId]: resetClouds
          }
        });
      },

      setEndingSequenceState: (state) => {
        set({ endingSequenceState: state });
      },

      getEndingSequenceState: () => {
        return get().endingSequenceState;
      },

      completeEndingSequence: () => {
        set({ endingSequenceState: 'completed' });
      },

      setBlowThreshold: (threshold) => {
        set({ blowThreshold: threshold });
      },

      getBlowThreshold: () => {
        return get().blowThreshold;
      },

      resetAllProgress: () => set(initialState),
    }),
    {
      name: 'blow-it-game-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentLevel: state.currentLevel,
        completedLevels: state.completedLevels,
        cloudStates: state.cloudStates,
        isGameComplete: state.isGameComplete,
        endingSequenceState: state.endingSequenceState,
        blowThreshold: state.blowThreshold,
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...persistedState,
      }),
    }
  )
);

export default useGameStore;