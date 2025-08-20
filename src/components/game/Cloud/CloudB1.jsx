import React, { useState, useEffect, useCallback, useRef } from 'react';
import { gsap } from 'gsap';
import useCloudZoom from '@hooks/useCloudZoom';
import useBlowDetection from '@hooks/useBlowDetection';
import useHintDisplay from '@hooks/useHintDisplay';
import useGameStore from '@store/gameStore';
import { getRandomCloudImages } from '@data/cloudDefinitions';
import styles from './Cloud.module.css';
import Layer3Text from './Layer3Text';
import { 
  CLOUD_ANIMATION_DURATION, 
  TRANSITION_SETTLE_TIME, 
  MICROPHONE_START_DELAY 
} from './constants/cloudConstants';
import { createLayer3Timeline, createFeedbackWiggle, startBlowDetectionWithErrorHandling } from './utils/cloudAnimations';

const CloudB1 = ({ levelId, cloudId, position, content, onReveal, containerRef }) => {
  const { getCloudState, advanceCloudLayer, getBlowThreshold } = useGameStore();
  const cloudState = getCloudState(levelId, cloudId);

  const [regularCloudImage] = useState(() => getRandomCloudImages(1, 'Regular')[0]);
  const [heavyCloudImage] = useState(() => getRandomCloudImages(1, 'Heavy')[0]);
  const [isReverseDirection] = useState(() => Math.random() > 0.5);
  const [animationDuration] = useState(() => 8 + Math.random() * 6);
  const [isExitAnimating, setIsExitAnimating] = useState(false);

  const { cloudRef, isZoomed, isZoomingOut, handleZoomIn, handleZoomOut } = useCloudZoom(cloudState?.isRevealed, cloudId);

  // Use the centralized hint display system
  useHintDisplay(levelId, cloudId, isZoomed, cloudState?.isRevealed);

  // Refs for managing visual elements
  const layer1CloudRef = useRef(null);
  const layer2CloudRef = useRef(null);
  const layer1TextRef = useRef(null);
  const layer2TextRef = useRef(null);
  const layer3TextRef = useRef(null);

  const isTransitioning = useRef(false);
  const currentLayerRef = useRef(cloudState?.currentLayer);
  const transitioningFromLayer = useRef(null);

  // Update layer ref when state changes
  useEffect(() => {
    currentLayerRef.current = cloudState?.currentLayer;
  }, [cloudState?.currentLayer]);


  const animateElementsOut = useCallback((elements, onComplete, shouldShowLayer3 = false) => {
    let timeline;
    
    if (shouldShowLayer3) {
      timeline = createLayer3Timeline(
        layer3TextRef.current,
        () => {
          onComplete();
          setTimeout(() => {
            isTransitioning.current = false;
          }, TRANSITION_SETTLE_TIME);
        }
      );
    } else {
      timeline = gsap.timeline({
        onComplete: () => {
          onComplete();
          setTimeout(() => {
            isTransitioning.current = false;
          }, TRANSITION_SETTLE_TIME);
        }
      });
    }

    elements.forEach(element => {
      if (element.current) {
        gsap.killTweensOf(element.current);
        element.current.style.transition = 'none';

        timeline.to(element.current, {
          y: -300,
          opacity: 0,
          scale: 0.8,
          duration: CLOUD_ANIMATION_DURATION,
          ease: 'sine.out'
        }, 0);
      }
    });
  }, []);
  const handleLayer1Blow = useCallback(() => {
    if (!isZoomed || isZoomingOut || isTransitioning.current || currentLayerRef.current !== 1) {
      return;
    }

    // Disable CSS floating animation before GSAP takes over
    setIsExitAnimating(true);
    
    isTransitioning.current = true;
    transitioningFromLayer.current = 1; // Remember we're transitioning from Layer 1
    
    // Hide text immediately when blow is detected
    if (layer1TextRef.current) {
      layer1TextRef.current.style.display = 'none';
    }
    
    // Advance layer immediately to show Layer 2 behind Layer 1
    advanceCloudLayer(levelId, cloudId);
    
    animateElementsOut(
      [layer1CloudRef],
      () => {
        // Animation complete, cleanup
        setTimeout(() => {
          isTransitioning.current = false;
          transitioningFromLayer.current = null;
        }, TRANSITION_SETTLE_TIME);
      },
      false // Don't show Layer 3 when transitioning to Layer 2
    );
  }, [isZoomed, isZoomingOut, advanceCloudLayer, levelId, cloudId, animateElementsOut]);

  const handleLayer2LongBlow = useCallback(() => {
    if (!isZoomed || isZoomingOut || isTransitioning.current || currentLayerRef.current !== 2) {
      return;
    }

    isTransitioning.current = true;
    
    // Hide text immediately when blow is detected
    if (layer2TextRef.current) {
      layer2TextRef.current.style.display = 'none';
    }
    
    animateElementsOut(
      [layer2CloudRef],
      () => {
        advanceCloudLayer(levelId, cloudId);
        onReveal?.(cloudId);
      },
      true // Show Layer 3 when transitioning from Layer 2 to final revealed state
    );
  }, [isZoomed, isZoomingOut, advanceCloudLayer, levelId, cloudId, onReveal, animateElementsOut]);

  const handleLayer2Feedback = useCallback(() => {
    if (currentLayerRef.current !== 2 || isTransitioning.current) {
      return;
    }

    createFeedbackWiggle(layer2CloudRef, 'medium');
  }, []);

  // Simplified blow detection handlers
  const { startListening, stopListening } = useBlowDetection({
    onAnyBlow: () => {
      if (currentLayerRef.current === 1) {
        handleLayer1Blow();
      } else if (currentLayerRef.current === 2) {
        handleLayer2Feedback();
      }
    },
    onLongBlow: () => {
      if (currentLayerRef.current === 1) {
        handleLayer1Blow();
      } else if (currentLayerRef.current === 2) {
        handleLayer2LongBlow();
      }
    },
    onDoubleBlow: handleLayer2Feedback,
    blowThreshold: getBlowThreshold(),
  });


  // Cleaned up microphone lifecycle
  const micTimeoutRef = useRef(null);

  useEffect(() => {
    // Clear any pending timeout first
    if (micTimeoutRef.current) {
      clearTimeout(micTimeoutRef.current);
      micTimeoutRef.current = null;
    }

    const shouldListen = isZoomed && !cloudState?.isRevealed;

    if (shouldListen) {
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
  }, [isZoomed, cloudState?.isRevealed, startListening, stopListening]);

  // Hint handling is now done by useHintDisplay hook

  if (!cloudState) return null;

  const isLayer1 = cloudState.currentLayer === 1;
  const isLayer2 = cloudState.currentLayer === 2;
  const isLayer3 = cloudState.currentLayer === 3;


  return (
    <div
      ref={containerRef}
      className={styles.cloudContainer}
      style={{
        left: position?.x,
        top: position?.y,
      }}
    >
      <div
        ref={cloudRef}
        className={`${styles.cloud} ${cloudState.isRevealed ? styles.revealed : ''} ${isZoomed ? styles.zoomed : ''}`}
        onClick={!isZoomed ? handleZoomIn : (cloudState?.isRevealed ? handleZoomOut : undefined)}
        data-flip-id={cloudId}
      >
        <Layer3Text
          layer3TextRef={layer3TextRef}
          content={content.layer3}
          isLayer3={isLayer3}
          isZoomed={isZoomed}
          isZoomingOut={isZoomingOut}
        />

        {/* Layer 2 - Intermediate state with Heavy cloud */}
        {isZoomed && !isZoomingOut && (
          <>
            <div className={styles.cloudImage}>
              <img
                ref={layer2CloudRef}
                src={heavyCloudImage}
                className={`${styles.floatingCloud} ${!cloudState?.isRevealed && !isExitAnimating
                  ? (isReverseDirection ? styles.floatingReverse : styles.floating)
                  : ''
                  }`}
                style={{
                  '--floating-duration': `${animationDuration}s`
                }}
              />
            </div>
            {isLayer2 && (
              <div ref={layer2TextRef} className={styles.textContent}>
                <p className={styles.regularLayerText}>
                  {content.layer2}
                </p>
              </div>
            )}
          </>
        )}

        {/* Layer 1 - Initial state with Regular cloud */}
        {(isLayer1 || (isTransitioning.current && transitioningFromLayer.current === 1)) && (
          <>
            <div className={`${styles.cloudImage} ${styles.topLayer}`}>
              <img
                ref={layer1CloudRef}
                src={regularCloudImage}
                className={`${styles.floatingCloud} ${!cloudState?.isRevealed && !isExitAnimating
                  ? (isReverseDirection ? styles.floatingReverse : styles.floating)
                  : ''
                  }`}
                style={{
                  '--floating-duration': `${animationDuration}s`
                }}
              />
            </div>

            {isZoomed && !isZoomingOut && (isLayer1 || (isTransitioning.current && transitioningFromLayer.current === 1)) && (
              <div ref={layer1TextRef} className={styles.textContent}>
                <p className={styles.regularLayerText}>
                  {content.layer1}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CloudB1;