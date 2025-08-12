import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const initialState = {
  currentLevel: 0,
  completedLevels: [],

  // Updated structure to track layer states
  // Format: { levelId: { cloudId: { currentLayer: 1, isRevealed: false, cloudType: 'A1' } } }
  cloudStates: {},
};

const useGameStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      setCurrentLevel: (level) => set({ currentLevel: level }),

      completeLevel: (levelId) => {
        const { completedLevels } = get();

        if (!completedLevels.includes(levelId)) {
          set({
            completedLevels: [...completedLevels, levelId],
            currentLevel: Math.max(get().currentLevel, levelId + 1)
          });
        }
      },

      isLevelUnlocked: (levelId) => {
        if (levelId === 0) return true;
        if (levelId === 1) return true;
        return get().completedLevels.includes(levelId - 1);
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

        if (!cloudState) return;

        let newLayer;
        let isRevealed;

        // A-type clouds: Layer 1 → Layer 3 (skip layer 2)
        if (cloudState.cloudType.startsWith('A')) {
          if (cloudState.currentLayer === 1) {
            newLayer = 3; // Skip directly to layer 3
            isRevealed = true;
          } else {
            newLayer = cloudState.currentLayer; // Already at final layer
            isRevealed = true;
          }
        }
        // B-type clouds: Layer 1 → Layer 2 → Layer 3
        else if (cloudState.cloudType.startsWith('B')) {
          newLayer = cloudState.currentLayer + 1;
          isRevealed = newLayer === 3;
        }
        // Fallback
        else {
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

      // Check if level is completed (all clouds revealed)
      isLevelCompleted: (levelId) => {
        const { cloudStates } = get();
        const levelClouds = cloudStates[levelId] || {};
        const cloudArray = Object.values(levelClouds);

        return cloudArray.length > 0 && cloudArray.every(cloud => cloud.isRevealed);
      },

      resetAllProgress: () => set(initialState),
    }),
    {
      name: 'blow-it-game-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useGameStore;