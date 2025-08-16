import React, { useState, useEffect, useCallback, useRef } from 'react';
import { gsap } from 'gsap';
import useCloudZoom from '@hooks/useCloudZoom';
import useBlowDetection from '@hooks/useBlowDetection';
import useHintDisplay from '@hooks/useHintDisplay';
import useGameStore from '@store/gameStore';
import { getRandomCloudImages } from '@data/cloudDefinitions';
import styles from './Cloud.module.css';
import AudioLevelIndicator from './AudioLevelIndicator';
import Layer3Text from './Layer3Text';
import { 
  ANIMATION_DURATION, 
  TRANSITION_SETTLE_TIME, 
  MICROPHONE_START_DELAY 
} from './constants/cloudConstants';
import { createLayer3Timeline, createFeedbackWiggle, startBlowDetectionWithErrorHandling } from './utils/cloudAnimations';

const CloudB1 = ({ levelId, cloudId, position, content, onReveal }) => {
  const { getCloudState, advanceCloudLayer } = useGameStore();
  const cloudState = getCloudState(levelId, cloudId);

  const [regularCloudImage] = useState(() => getRandomCloudImages(1, 'Regular')[0]);
  const [heavyCloudImage] = useState(() => getRandomCloudImages(1, 'Heavy')[0]);
  const [animationDelay] = useState(() => Math.random() * 10);
  const [isReverseDirection] = useState(() => Math.random() > 0.5);
  const [animationDuration] = useState(() => 8 + Math.random() * 6);

  const { cloudRef, isZoomed, isZoomingOut, handleZoomIn, handleZoomOut } = useCloudZoom(cloudState?.isRevealed);

  // Use the centralized hint display system
  useHintDisplay(levelId, cloudId, isZoomed, cloudState?.isRevealed);

  // Refs for managing visual elements
  const layer1CloudRef = useRef(null);
  const layer2CloudRef = useRef(null);
  const layer1TextRef = useRef(null);
  const layer2TextRef = useRef(null);
  const layer3TextRef = useRef(null);

  const [audioLevel, setAudioLevel] = useState(0);
  const isTransitioning = useRef(false);
  const currentLayerRef = useRef(cloudState?.currentLayer);

  // Update layer ref when state changes
  useEffect(() => {
    currentLayerRef.current = cloudState?.currentLayer;
  }, [cloudState?.currentLayer]);


  const animateElementsOut = useCallback((elements, onComplete) => {
    const timeline = createLayer3Timeline(
      layer3TextRef.current,
      () => {
        onComplete();
        setTimeout(() => {
          isTransitioning.current = false;
        }, TRANSITION_SETTLE_TIME);
      }
    );

    elements.forEach(element => {
      if (element.current) {
        gsap.killTweensOf(element.current);
        element.current.style.transition = 'none';

        timeline.to(element.current, {
          y: -300,
          opacity: 0,
          scale: 0.8,
          duration: ANIMATION_DURATION,
          ease: 'sine.out'
        }, 0);
      }
    });
  }, []);
  const handleLayer1Blow = useCallback(() => {
    if (!isZoomed || isZoomingOut || isTransitioning.current || currentLayerRef.current !== 1) {
      return;
    }

    isTransitioning.current = true;
    animateElementsOut(
      [layer1CloudRef, layer1TextRef],
      () => advanceCloudLayer(levelId, cloudId)
    );
  }, [isZoomed, isZoomingOut, advanceCloudLayer, levelId, cloudId, animateElementsOut]);

  const handleLayer2LongBlow = useCallback(() => {
    if (!isZoomed || isZoomingOut || isTransitioning.current || currentLayerRef.current !== 2) {
      return;
    }

    isTransitioning.current = true;
    animateElementsOut(
      [layer2CloudRef, layer2TextRef],
      () => {
        advanceCloudLayer(levelId, cloudId);
        onReveal?.(cloudId);
      }
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
    onLevelChange: setAudioLevel
  });


  // Cleaned up microphone lifecycle
  useEffect(() => {
    const shouldListen = isZoomed && !cloudState?.isRevealed;

    if (shouldListen) {
      const timeoutId = setTimeout(() => {
        startBlowDetectionWithErrorHandling(startListening);
      }, MICROPHONE_START_DELAY);

      return () => clearTimeout(timeoutId);
    } else {
      stopListening();
    }
  }, [isZoomed, cloudState?.isRevealed, startListening, stopListening]);

  // Hint handling is now done by useHintDisplay hook

  if (!cloudState) return null;

  const isLayer1 = cloudState.currentLayer === 1;
  const isLayer2 = cloudState.currentLayer === 2;
  const isLayer3 = cloudState.currentLayer === 3;

  const getAudioIndicatorText = () => {
    if (isLayer1) return "Blow to continue";
    if (isLayer2) return "Long blow to reveal";
    return "";
  };

  return (
    <div
      className={styles.cloudContainer}
      style={{
        left: position?.x,
        top: position?.y
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
        />

        {/* Layer 2 - Intermediate state with Heavy cloud */}
        {/* Show Layer 2 when zoomed and not yet blown away (currentLayer <= 2) */}
        {isZoomed && !isZoomingOut && cloudState.currentLayer <= 2 && (
          <>
            <div className={`${styles.cloudImage} ${isLayer1 ? styles.underLayer : ''}`}>
              <img
                ref={layer2CloudRef}
                src={heavyCloudImage}
                className={styles.floatingCloud}
              />
            </div>
            {isLayer2 && (
              <div ref={layer2TextRef} className={styles.textContent}>
                <p className={styles.regularLayerText}>
                  {content.layer2}
                </p>
                <AudioLevelIndicator
                  audioLevel={audioLevel}
                  inactiveText={getAudioIndicatorText()}
                />
              </div>
            )}
          </>
        )}

        {/* Layer 1 - Initial state with Regular cloud */}
        {isLayer1 && (
          <>
            <div className={`${styles.cloudImage} ${styles.topLayer}`}>
              <img
                ref={layer1CloudRef}
                src={regularCloudImage}
                className={`${styles.floatingCloud} ${!cloudState?.isRevealed && !isZoomed
                  ? (isReverseDirection ? styles.floatingReverse : styles.floating)
                  : ''
                  }`}
                style={{
                  '--floating-delay': `${animationDelay}s`,
                  '--floating-duration': `${animationDuration}s`
                }}
              />
            </div>

            {isZoomed && !isZoomingOut && (
              <div ref={layer1TextRef} className={styles.textContent}>
                <p className={styles.regularLayerText}>
                  {content.layer1}
                </p>
                <AudioLevelIndicator
                  audioLevel={audioLevel}
                  inactiveText={getAudioIndicatorText()}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CloudB1;