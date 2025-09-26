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

  tutorialState: 'not_started', // 'not_started', 'permission_setup', 'practicing', 'completed'
  tutorialAttempts: 0,
  microphoneCalibrated: false,
  microphonePermissionGranted: false,
};

const useGameStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      setCurrentLevel: (level) => set({ currentLevel: level }),

      // Handle tutorial completion unlocking level 1
      completeLevel: (levelId) => {
        const { completedLevels, currentLevel } = get();

        // Only update state if this is the first completion
        const isFirstTimeCompletion = !completedLevels.includes(levelId);

        if (isFirstTimeCompletion) {
          const newCurrentLevel = Math.max(currentLevel, levelId + 1);
          const newCompletedLevels = [...completedLevels, levelId];
          const isGameComplete = newCompletedLevels.length === 10;


          if (isGameComplete) {
            console.log('Game completed! Have you tried https://hammering.netlify.app/ ?');
          }

          // Special handling for level 10 first completion
          const shouldTriggerEndingSequence = levelId === 10 && isFirstTimeCompletion;

          set({
            completedLevels: newCompletedLevels,
            currentLevel: newCurrentLevel,
            isGameComplete,
            endingSequenceState: shouldTriggerEndingSequence ? 'bonus_available' : get().endingSequenceState
          });
        }
      },

      isLevelUnlocked: (levelId) => {
        const { currentLevel, tutorialState } = get();

        // Level 1 is only unlocked after tutorial completion
        if (levelId === 1) {
          return tutorialState === 'completed';
        }

        // Other levels follow normal progression
        return levelId <= currentLevel;
      },

      isLevelCompletedBefore: (levelId) => {
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

      // Tutorial-specific actions
      startTutorial: () => {
        const { tutorialAttempts } = get();
        set({
          tutorialState: 'permission_setup',
          tutorialAttempts: tutorialAttempts + 1
        });
      },

      completeTutorialPermissionSetup: () => {
        set({ tutorialState: 'practicing', microphonePermissionGranted: true });
      },

      completeTutorial: () => {
        const { currentLevel } = get();

        set({
          tutorialState: 'completed',
          microphoneCalibrated: true,
          // Ensure level 1 is unlocked when tutorial completes
          currentLevel: Math.max(currentLevel, 1)
        });
      },

      resetTutorial: () => {
        set({
          tutorialState: 'not_started',
          tutorialAttempts: 0,
          microphoneCalibrated: false,
          microphonePermissionGranted: false
        });
      },

      getTutorialState: () => {
        return get().tutorialState;
      },

      isTutorialCompleted: () => {
        return get().tutorialState === 'completed';
      },

      shouldShowTutorial: () => {
        const { tutorialState, completedLevels, currentLevel } = get();

        // Show tutorial if it's not completed AND user hasn't started real game
        return tutorialState !== 'completed' &&
          completedLevels.length === 0 &&
          currentLevel === 0;
      },

      // Cloud instance-related states
      setZoomState: (isZoomed, cloudId = null) => {
        set({
          isZoomed,
          zoomedCloudId: isZoomed ? cloudId : null
        });
      },

      initializeClouds: (levelId, cloudConfigs) => {
        const { cloudStates } = get();

        // Don't reinitialize if clouds already exist for this level
        if (cloudStates[levelId]) {
          return;
        }

        const newClouds = {};
        cloudConfigs.forEach(cloudConfig => {
          newClouds[cloudConfig.cloudId] = {
            cloudId: cloudConfig.cloudId,
            cloudType: cloudConfig.cloudType,
            currentLayer: 1,
            isRevealed: false,
            content: cloudConfig.content || {}
          };
        });

        set({
          cloudStates: {
            ...cloudStates,
            [levelId]: newClouds
          }
        });
      },

      advanceCloudLayer: (levelId, cloudId) => {
        const { cloudStates } = get();
        const levelClouds = cloudStates[levelId];

        if (!levelClouds || !levelClouds[cloudId]) {
          return;
        }

        const cloudState = levelClouds[cloudId];
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

      getZoomedCloudState: (levelId) => {
        const { cloudStates, zoomedCloudId } = get();
        return zoomedCloudId ? cloudStates[levelId]?.[zoomedCloudId] || null : null;
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
        // Persist tutorial state
        tutorialState: state.tutorialState,
        tutorialAttempts: state.tutorialAttempts,
        microphoneCalibrated: state.microphoneCalibrated,
        microphonePermissionGranted: state.microphonePermissionGranted,
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...persistedState,
      }),
    }
  )
);

export default useGameStore;