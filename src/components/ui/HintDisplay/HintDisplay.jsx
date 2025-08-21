import React, { useCallback } from 'react';
import useHintStore from '@store/hintStore';
import ActionButton from '@components/ui/ActionButton/ActionButton';
import styles from './HintDisplay.module.css';

const HintDisplay = () => {
  const currentHint = useHintStore(state => state.currentHint);
  const isHintVisible = useHintStore(state => state.isHintVisible);
  const hideHint = useHintStore(state => state.hideHint);

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


  if (!currentHint) return null;

  return (
    <div 
      className={`${styles.hintContainer} ${isHintVisible ? styles.visible : styles.hidden}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="hint-text"
      onKeyDown={handleKeyDown}
    >
      <p id="hint-text" className={styles.hintText}>
        {currentHint}
      </p>
      
      {isHintVisible && (
        <div className={styles.hintActions}>
          <ActionButton
            variant="level"
            onClick={handleDismiss}
            data-hint-dismiss-button
            aria-label={`Dismiss hint: ${currentHint}`}
          >
            Ok
          </ActionButton>
        </div>
      )}
    </div>
  );
};

export default HintDisplay;