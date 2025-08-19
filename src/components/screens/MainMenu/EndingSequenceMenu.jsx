import React, { useState, useRef, useEffect, useCallback } from 'react';
import { gsap } from 'gsap';
import useGameStore from '@store/gameStore';
import useBlowDetection from '@hooks/useBlowDetection';
import { getRandomCloudImages } from '@data/cloudDefinitions';
import { MICROPHONE_START_DELAY } from '@components/game/Cloud/constants/cloudConstants';
import { startBlowDetectionWithErrorHandling } from '@components/game/Cloud/utils/cloudAnimations';
import cloudStyles from '@components/game/Cloud/Cloud.module.css';
import styles from './MainMenu.module.css';

const EndingSequenceMenu = ({ onComplete }) => {
  const { completeEndingSequence, getBlowThreshold } = useGameStore();
  const [endingPhase, setEndingPhase] = useState('unlock_prompt'); // 'unlock_prompt' | 'joke_reveal'
  const [isComplete, setIsComplete] = useState(false);
  // Always zoomed for this sequence - no state needed
  const [cloudImage] = useState(() => getRandomCloudImages(1, 'Regular')[0]);

  const cloudRef = useRef(null);
  const textContentRef = useRef(null);
  const layer3TextRef = useRef(null);
  const micTimeoutRef = useRef(null);

  // Content for the ending cloud based on phase
  const getCurrentText = () => {
    if (endingPhase === 'unlock_prompt') {
      return "Ready for the biggest challenge?";
    } else {
      return "Just kidding, you've completed the game";
    }
  };

  // Handle the cloud reveal (first blow)
  const handleAnyBlow = useCallback(() => {
    if (endingPhase === 'unlock_prompt' && !isComplete) {
      // Hide text immediately when blow is detected
      if (textContentRef.current) {
        textContentRef.current.style.display = 'none';
      }

      // Show layer 3 text with congratulations
      if (layer3TextRef.current) {
        layer3TextRef.current.style.opacity = '1';
        layer3TextRef.current.style.transform = 'translate(-50%, -50%) scale(1)';
      }

      // Animate cloud image out
      const cloudImage = cloudRef.current?.querySelector('img');
      if (cloudImage) {
        gsap.to(cloudImage, {
          y: -300,
          opacity: 0,
          scale: 0.8,
          duration: 1.2,
          ease: 'sine.out'
        });
      }

      // Move to joke reveal phase
      setEndingPhase('joke_reveal');
    }
  }, [endingPhase, isComplete]);

  // Blow detection setup
  const { startListening, stopListening } = useBlowDetection({
    onAnyBlow: handleAnyBlow,
    onLevelChange: () => {}, // No-op for ending sequence
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

  // Handle click anywhere to complete the sequence
  const handleCompleteSequence = () => {
    if (endingPhase === 'joke_reveal' && !isComplete) {
      setIsComplete(true);
      
      // Fade out the entire cloud
      if (cloudRef.current) {
        gsap.to(cloudRef.current, {
          opacity: 0,
          scale: 0.8,
          duration: 1,
          ease: 'power2.out',
          onComplete: () => {
            completeEndingSequence();
            onComplete();
          }
        });
      } else {
        // Fallback if animation fails
        completeEndingSequence();
        onComplete();
      }
    }
  };

  return (
    <div 
      className={styles.menuContent}
      onClick={handleCompleteSequence}
      style={{ cursor: endingPhase === 'joke_reveal' ? 'pointer' : 'default' }}
    >
      {/* Center the cloud in the screen */}
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
          {/* Layer 3 Text (congratulations) */}
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

          {/* Cloud Image */}
          <div className={cloudStyles.cloudImage}>
            <img
              src={cloudImage}
              className={cloudStyles.floatingCloud}
              alt="Ending sequence cloud"
            />
          </div>

          {/* Layer 1 Text */}
          <div ref={textContentRef} className={cloudStyles.textContent}>
            <p className={cloudStyles.regularLayerText}>
              {getCurrentText()}
            </p>
          </div>
        </div>
      </div>
      
      {/* Subtle instruction text */}
      {endingPhase === 'joke_reveal' && !isComplete && (
        <div style={{
          position: 'absolute',
          top: '50px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '14px',
          textAlign: 'center'
        }}>
          <p>Click anywhere to continue</p>
        </div>
      )}
    </div>
  );
};

export default EndingSequenceMenu;