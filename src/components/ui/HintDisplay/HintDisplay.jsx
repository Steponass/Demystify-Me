import React, { useCallback } from 'react';
import useHintStore from '@store/hintStore';
import ActionButton from '@components/ui/ActionButton/ActionButton';
import styles from './HintDisplay.module.css';

const HINT_VARIANTS = {
  'A1': {
    first: 'Blow into your microphone until the wind icon is full',
    second: 'Simple clouds only need a shorter (~0.3s) blow',
    repeated: 'Nothing? Go to Menu and increase microphone sensitivty'
  },
  'A2': {
    first: 'Blow twice. Briefly pause between each blow',
    second: 'Try two separate breaths. Pause between each blow',
    repeated: 'Two quick or long puffs should do it. Blow-pause-blow'
  },
  'A3': {
    first: 'A stubborn one! Try a longer blow',
    second: 'You will have to blow for at least 1.2s',
    repeated: 'Is it wiggling? Blow for longer. Denial is strong with this one.'
  },
  'B1': {
    first: 'This has 2 clouds: first one is simple; second one needs a longer blow',
    second: 'First layer needs a quick puff; second: at least 0.8s long',
    repeated: 'Is it wiggling? It means you need to blow for longer'
  },
};

const HintDisplay = () => {
  const currentHintData = useHintStore(state => state.currentHintData);
  const isHintVisible = useHintStore(state => state.isHintVisible);
  const hideHint = useHintStore(state => state.hideHint);

  const getHintText = useCallback(() => {
    if (!currentHintData?.cloudType || !currentHintData?.variant) {
      return null;
    }
    
    const cloudHints = HINT_VARIANTS[currentHintData.cloudType];
    if (!cloudHints) return null;
    
    return cloudHints[currentHintData.variant] || null;
  }, [currentHintData]);

  const handleDismiss = useCallback(() => {
    hideHint();
  }, [hideHint]);

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleDismiss();
    }
    if (event.key === 'Escape') {
      handleDismiss();
    }
  }, [handleDismiss]);


  const hintText = getHintText();
  
  if (!hintText) return null;

  return (
    <div 
      className={`${styles.hintContainer} ${isHintVisible ? styles.visible : styles.hidden}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="hint-text"
      onKeyDown={handleKeyDown}
    >
      <p id="hint-text" className={styles.hintText}>
        {hintText}
      </p>
      
      {isHintVisible && (
        <div className={styles.hintActions}>
          <ActionButton
            variant="level"
            onClick={handleDismiss}
            data-hint-dismiss-button
            aria-label={`Dismiss hint: ${hintText}`}
          >
            Ok
          </ActionButton>
        </div>
      )}
    </div>
  );
};

export default HintDisplay;