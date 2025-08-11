import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const initialState = {
  currentLevel: 0,
  completedLevels: [],
  
  // Track revealed clouds per level
  // Format: { levelId: [cloudId1, cloudId2, ...] }
  revealedClouds: {},
};

const useGameStore = create(
  persist(
    (set, get) => ({
      ...initialState,
      
      setCurrentLevel: (level) => set({ currentLevel: level }),
      
      completeLevel: (levelId) => {
        const { completedLevels } = get();
        
        // Only add if not already completed
        if (!completedLevels.includes(levelId)) {
          set({
            completedLevels: [...completedLevels, levelId],
            // Auto-unlock next level
            currentLevel: Math.max(get().currentLevel, levelId + 1)
          });
        }
      },
      
      isLevelUnlocked: (levelId) => {
        // Tutorial & Level 1 are always unlocked
        if (levelId === 0) return true;
        if (levelId === 1) return true;
        // Other levels require previous level completion
        return get().completedLevels.includes(levelId - 1);
      },
      
      // Mark a cloud as revealed
      revealCloud: (levelId, cloudId) => {
        const { revealedClouds } = get();
        
        // Get the current revealed clouds for this level or initialize empty array
        const levelClouds = revealedClouds[levelId] || [];
        
        // Only add if not already revealed
        if (!levelClouds.includes(cloudId)) {
          set({
            revealedClouds: {
              ...revealedClouds,
              [levelId]: [...levelClouds, cloudId]
            }
          });
        }
      },
      
      // Check if a cloud is revealed
      isCloudRevealed: (levelId, cloudId) => {
        const { revealedClouds } = get();
        const levelClouds = revealedClouds[levelId] || [];
        return levelClouds.includes(cloudId);
      },
      
      // Check if a level is completed (all clouds revealed)
      isLevelCompleted: (levelId) => {
        return get().completedLevels.includes(levelId);
      },
      
      // Reset progress for a specific cloud (for the rewind feature)
      resetCloud: (levelId, cloudId) => {
        const { revealedClouds } = get();
        const levelClouds = revealedClouds[levelId] || [];
        
        set({
          revealedClouds: {
            ...revealedClouds,
            [levelId]: levelClouds.filter(id => id !== cloudId)
          }
        });
      },
      
      // Reset all progress (for development/testing)
      resetAllProgress: () => set(initialState),
    }),
    {
      name: 'blow-it-game-storage', // unique name for localStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useGameStore;