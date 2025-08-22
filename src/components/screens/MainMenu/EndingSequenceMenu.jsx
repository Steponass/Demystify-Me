import React, { useState, useRef, useEffect, useCallback } from 'react';
import { gsap } from 'gsap';
import useGameStore from '@store/gameStore';
import useBlowDetection from '@hooks/useBlowDetection';
import { MICROPHONE_START_DELAY } from '@components/game/Cloud/constants/cloudConstants';
import { startBlowDetectionWithErrorHandling } from '@components/game/Cloud/utils/cloudAnimations';
import cloudStyles from '@components/game/Cloud/Cloud.module.css';
import styles from './MainMenu.module.css';

const EndingSequenceMenu = ({ onComplete }) => {
  const { completeEndingSequence, getBlowThreshold } = useGameStore();
  const [endingPhase, setEndingPhase] = useState('unlock_prompt');
  const [isComplete, setIsComplete] = useState(false);
  const cloudImage = '/images/clouds/Regular/Cloud_Reg_3.webp';

  const cloudRef = useRef(null);
  const textContentRef = useRef(null);
  const layer3TextRef = useRef(null);
  const micTimeoutRef = useRef(null);

  const getCurrentText = () => {
    if (endingPhase === 'unlock_prompt') {
      return "Ready for the biggest challenge?";
    } else {
      return "Just kidding, you've completed the game";
    }
  };

  const handleAnyBlow = useCallback(() => {
    if (endingPhase === 'unlock_prompt' && !isComplete) {
      if (textContentRef.current) {
        textContentRef.current.style.display = 'none';
      }

      if (layer3TextRef.current) {
        layer3TextRef.current.style.opacity = '1';
        layer3TextRef.current.style.transform = 'translate(-50%, -50%) scale(1)';
      }

      const cloudImage = cloudRef.current?.querySelector('img');
      if (cloudImage) {
        gsap.to(cloudImage, {
          opacity: 0,
          scale: 6,
          duration: 2,
          ease: 'sine.inOut'
        });
      }

      setEndingPhase('joke_reveal');
    }
  }, [endingPhase, isComplete]);

  const { startListening, stopListening } = useBlowDetection({
    onAnyBlow: handleAnyBlow,
    onLevelChange: () => { },
    blowThreshold: getBlowThreshold(),
  });

  // Microphone lifecycle
  useEffect(() => {
    if (micTimeoutRef.current) {
      clearTimeout(micTimeoutRef.current);
      micTimeoutRef.current = null;
    }

    if (endingPhase === 'unlock_prompt' && !isComplete) {
      micTimeoutRef.current = setTimeout(() => {
        startBlowDetectionWithErrorHandling(startListening);
        micTimeoutRef.current = null;
      }, MICROPHONE_START_DELAY);
    } else {
      stopListening();
    }

    return () => {
      if (micTimeoutRef.current) {
        clearTimeout(micTimeoutRef.current);
        micTimeoutRef.current = null;
      }
    };
  }, [endingPhase, isComplete, startListening, stopListening]);

  const handleCompleteSequence = () => {
    if (endingPhase === 'joke_reveal' && !isComplete) {
      setIsComplete(true);
      completeEndingSequence();
      onComplete();
    }
  };

  return (
    <div
      className={styles.menuContent}
      onClick={handleCompleteSequence}
      style={{ cursor: endingPhase === 'joke_reveal' ? 'pointer' : 'default' }}
    >

      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px',
        height: '300px',
        zIndex: 1000
      }}>
        <div
          ref={cloudRef}
          className={`${cloudStyles.cloud} ${cloudStyles.zoomed}`}
          data-flip-id="ending-cloud"
        >

          <div
            ref={layer3TextRef}
            className={cloudStyles.textContent}
            style={{
              opacity: 0,
              transform: 'translate(-50%, -50%) scale(0.8)',
              transition: 'all 0.8s ease-out'
            }}
          >
            <p className={cloudStyles.finalLayerText}>
              Just kidding, this is the end.
            </p>
          </div>

          <div className={cloudStyles.cloudImage}>
            <img
              src={cloudImage}
              className={cloudStyles.floatingCloud}
            />
          </div>

          <div ref={textContentRef} className={cloudStyles.textContent}>
            <p className={cloudStyles.regularLayerText}>
              {getCurrentText()}
            </p>
          </div>
        </div>
      </div>

      {endingPhase === 'joke_reveal' && !isComplete && (
        <div style={{
          position: 'absolute',
          top: '50px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'rgba(255, 255, 255, 0.8)',
          textAlign: 'center'
        }}>
          <p>You can replay any level now</p>
        </div>
      )}
    </div>
  );
};

export default EndingSequenceMenu;