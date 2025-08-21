import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const CLOUD_HINTS = {
  'A1': 'Blow into the microphone',
  'A2': 'Blow twice',
  'A3': 'A stubborn one! Try a longer blow',
  'B1': 'This one has 2 layers',
};

const initialHintState = {
  // Current active hint
  currentHint: null,
  isHintVisible: false,
  
  // Tracking
  seenCloudTypes: [],
  
  // Configuration
  hintsEnabled: true,
};

const useHintStore = create(
  persist(
    (set, get) => ({
      ...initialHintState,

      showHint: (hintText) => {
        const { hintsEnabled } = get();
        
        if (!hintsEnabled) return;

        set({
          currentHint: hintText,
          isHintVisible: true,
        });
      },

      hideHint: () => {
        set({ 
          isHintVisible: false,
          currentHint: null,
        });
      },

      showCloudHint: (cloudType) => {
        const { seenCloudTypes, hintsEnabled } = get();
        
        if (!hintsEnabled) return;
        
        const hintText = CLOUD_HINTS[cloudType];
        if (!hintText) return;

        // Enabled for debugging, use commented after finished
        const shouldShow = true;
        // const shouldShow = !seenCloudTypes.includes(cloudType);

        if (shouldShow) {
          get().showHint(hintText);

          // Mark as seen
          // Disabled for debugging, enable after finished
          // set({
          //   seenCloudTypes: [...seenCloudTypes, cloudType],
          // });
        }
      },

      setHintsEnabled: (enabled) => {
        set({ hintsEnabled: enabled });
        
        if (!enabled) {
          set({ currentHint: null, isHintVisible: false });
        }
      },

      resetHintProgress: () => {
        set({
          seenCloudTypes: [],
          currentHint: null,
          isHintVisible: false,
        });
      },
    }),
    {
      name: 'hint-system-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        seenCloudTypes: state.seenCloudTypes,
        hintsEnabled: state.hintsEnabled,
      }),
    }
  )
);

export default useHintStore;