import React, { useCallback } from 'react';
import useHintStore from '@store/hintStore';
import ActionButton from '@components/ui/ActionButton/ActionButton';
import styles from './HintDisplay.module.css';

const HINT_VARIANTS = {
  'A1': {
    first: 'Blow into the microphone',
    second: 'Try a gentle, steady breath into the microphone',
    repeated: 'Still having trouble? Give it one more gentle blow - just breathe normally'
  },
  'A2': {
    first: 'Blow twice',
    second: 'Try two separate, distinct breaths - pause between each blow',
    repeated: 'Two quick puffs should do it! Blow-pause-blow'
  },
  'A3': {
    first: 'A stubborn one! Try a longer blow',
    second: 'This cloud needs a sustained, longer breath - hold it for 2-3 seconds',
    repeated: 'Keep that breath going! Try a really long, steady blow until it disappears'
  },
  'B1': {
    first: 'This one has 2 layers',
    second: 'Blow once to reveal the first layer, then blow again for the second',
    repeated: 'Two-stage cloud: blow to clear each layer one at a time'
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