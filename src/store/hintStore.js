import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const initialHintState = {
  currentHintData: null,
  isHintVisible: false,
  zoomCounts: {}, // Tracks how many times each cloud type has been zoomed (A1: 2, A2: 1, etc.)
  incorrectBlowCounts: {}, // Tracks incorrect blows per cloud instance (levelId-cloudId: count)
  hintsEnabled: true,
};

const useHintStore = create(
  persist(
    (set, get) => ({
      ...initialHintState,

      showHint: (cloudType, variant) => {
        const { hintsEnabled } = get();
        
        if (!hintsEnabled) return;

        set({
          currentHintData: { cloudType, variant },
          isHintVisible: true,
        });
      },

      hideHint: () => {
        set({ 
          isHintVisible: false,
          currentHintData: null,
        });
      },

      showCloudHint: (cloudType, levelId, cloudId) => {
        const { hintsEnabled, zoomCounts, incorrectBlowCounts } = get();
        
        if (!hintsEnabled) return;
        if (!cloudType) return;

        // Get current zoom count for this cloud type across the entire game
        const currentZoomCount = zoomCounts[cloudType] || 0;
        const newZoomCount = currentZoomCount + 1;
        
        // Reset incorrect blow count for this specific cloud instance when zooming in
        const cloudInstanceId = `${levelId}-${cloudId}`;
        
        let shouldShowHint = false;
        let variant;
        
        if (newZoomCount === 1) {
          // First time seeing this cloud type in the entire game
          variant = 'first';
          shouldShowHint = true;
        } else if (newZoomCount === 2) {
          // Second time seeing this cloud type
          variant = 'second';
          shouldShowHint = true;
        }
        
        // Update zoom count and reset incorrect blow count for this cloud instance
        set({
          zoomCounts: {
            ...zoomCounts,
            [cloudType]: newZoomCount
          },
          incorrectBlowCounts: {
            ...incorrectBlowCounts,
            [cloudInstanceId]: 0 // Reset to 0 when zooming in
          }
        });

        // Only show hint if it's first or second encounter
        if (shouldShowHint) {
          get().showHint(cloudType, variant);
        }
      },

      incrementIncorrectBlow: (levelId, cloudId, cloudType) => {
        const { incorrectBlowCounts, hintsEnabled } = get();
        
        if (!hintsEnabled) return;
        
        const cloudInstanceId = `${levelId}-${cloudId}`;
        const currentCount = incorrectBlowCounts[cloudInstanceId] || 0;
        const newCount = currentCount + 1;
        
        set({
          incorrectBlowCounts: {
            ...incorrectBlowCounts,
            [cloudInstanceId]: newCount
          }
        });
        
        // Show repeated hint if user has made 2+ incorrect attempts
        if (newCount >= 2) {
          get().showHint(cloudType, 'repeated');
          
          // Reset the count after showing repeated hint to give user a fresh start
          set({
            incorrectBlowCounts: {
              ...get().incorrectBlowCounts,
              [cloudInstanceId]: 0
            }
          });
        }
      },

      resetIncorrectBlowsForCloud: (levelId, cloudId) => {
        const { incorrectBlowCounts } = get();
        const cloudInstanceId = `${levelId}-${cloudId}`;
        
        // Remove the count for this specific cloud instance when zooming out
        const newIncorrectBlowCounts = { ...incorrectBlowCounts };
        delete newIncorrectBlowCounts[cloudInstanceId];
        
        set({
          incorrectBlowCounts: newIncorrectBlowCounts
        });
      },

      setHintsEnabled: (enabled) => {
        set({ hintsEnabled: enabled });
        
        if (!enabled) {
          set({ currentHintData: null, isHintVisible: false });
        }
      },

      resetHintProgress: () => {
        set({
          zoomCounts: {},
          incorrectBlowCounts: {},
          currentHintData: null,
          isHintVisible: false,
        });
      },
    }),
    {
      name: 'hint-system-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        zoomCounts: state.zoomCounts,
        incorrectBlowCounts: state.incorrectBlowCounts,
        hintsEnabled: state.hintsEnabled,
      }),
    }
  )
);

export default useHintStore;