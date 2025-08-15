import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const initialState = {
  currentLevel: 0,
  completedLevels: [],
  cloudStates: {},
  seenCloudTypes: [],
  currentHint: null,
  isHintVisible: false,
  isLevelTransitioning: false,
  shouldShowSplash: false,
  isZoomed: false,
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
          console.log(`Completing level ${levelId}. Current level will be: ${newCurrentLevel}`);

          set({
            completedLevels: [...completedLevels, levelId],
            currentLevel: newCurrentLevel
            // isLevelTransitioning removed as requested
          });
        } else {
          console.log(`Level ${levelId} was already completed before`);
        }
      }, isLevelCompletedBefore: (levelId) => {
        const { completedLevels } = get();
        return completedLevels.includes(levelId);
      },

      setZoomState: (isZoomed) => {
        set({ isZoomed });
      },

      getZoomState: () => {
        return get().isZoomed;
      },

      setLevelTransitioning: (isTransitioning) => {
        set({ isLevelTransitioning: isTransitioning });
      },

      setShouldShowSplash: (shouldShow) => {
        set({ shouldShowSplash: shouldShow });
      },

      isLevelUnlocked: (levelId) => {
        const { completedLevels } = get();

        // Only Level 1 is always unlocked, tutorial (level 0) is never allowed
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

      showHint: (cloudType) => {
        const state = get();

        // Ensure seenCloudTypes is always an array
        const seenCloudTypes = Array.isArray(state.seenCloudTypes) ? state.seenCloudTypes : [];

        if (!seenCloudTypes.includes(cloudType)) {
          const hints = {
            'A1': 'Blow into the microphone',
            'A2': 'Blow twice',
            'A3': 'A stubborn one! Try a longer blow',
            'B1': 'This one has 2 layers',
          };

          const hintText = hints[cloudType] || 'Blow into your microphone to interact';

          set({
            seenCloudTypes: [...seenCloudTypes, cloudType],
            currentHint: hintText,
            isHintVisible: true
          });
        }
      },

      hideHint: () => {
        set({ isHintVisible: false });
      },

      clearHint: () => {
        set({ currentHint: null });
      },

      advanceCloudLayer: (levelId, cloudId) => {
        const { cloudStates } = get();
        const levelClouds = cloudStates[levelId] || {};
        const cloudState = levelClouds[cloudId];

        console.log('Current cloud state:', { levelId, cloudId, cloudState });

        if (!cloudState) {
          console.warn('Cloud state not found:', { levelId, cloudId });
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
          console.warn(`No cloud states found for level ${levelId}`);
          return;
        }

        // Reset all clouds in the level to initial state
        const resetClouds = {};
        Object.keys(levelClouds).forEach(cloudId => {
          const cloudState = levelClouds[cloudId];
          resetClouds[cloudId] = {
            ...cloudState,
            currentLayer: 1,
            isRevealed: false
            // Keep cloudType unchanged - it's needed for proper functionality
          };
        });

        set({
          cloudStates: {
            ...cloudStates,
            [levelId]: resetClouds
          }
        });
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
        seenCloudTypes: state.seenCloudTypes,
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...persistedState,
        seenCloudTypes: Array.isArray(persistedState?.seenCloudTypes) ? persistedState.seenCloudTypes : [],
      }),
    }
  )
);

export default useGameStore;