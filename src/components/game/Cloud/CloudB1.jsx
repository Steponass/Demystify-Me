import React, { useState, useEffect, useCallback, useRef } from 'react';
import { gsap } from 'gsap';
import useCloudZoom from '@hooks/useCloudZoom';
import useBlowDetection from '@hooks/useBlowDetection';
import useHintDisplay from '@hooks/useHintDisplay';
import useGameStore from '@store/gameStore';
import { getRandomCloudImages } from '@data/cloudDefinitions';
import styles from './Cloud.module.css';
import AudioLevelIndicator from './AudioLevelIndicator';

const ANIMATION_DURATION = 0.6;
const TRANSITION_SETTLE_TIME = 300;
const MICROPHONE_START_DELAY = 100;

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
    // Create a GSAP timeline for coordinated animations
    const timeline = gsap.timeline({
      onComplete: () => {
        onComplete();
        setTimeout(() => {
          isTransitioning.current = false;
        }, TRANSITION_SETTLE_TIME);
      }
    });

    // First, ensure Layer 3 is visible immediately
    if (layer3TextRef.current && !cloudState?.isRevealed) {
      // Make Layer 3 visible with initial opacity 0
      gsap.set(layer3TextRef.current, {
        opacity: 0,
        display: 'block',
        visibility: 'visible',
        zIndex: 3
      });

      // Fade in Layer 3 immediately as other layers start to disappear
      timeline.to(layer3TextRef.current, {
        opacity: 1,
        duration: 0.3,
        ease: "sine.in"
      }, 0); // Start at the beginning of the timeline
    }

    // Animate out all provided elements
    elements.forEach(element => {
      if (element.current) {
        // Clear any CSS transitions first
        element.current.style.transition = 'none';

        // Add to the timeline (starting at the same time as Layer 3 fade in)
        timeline.to(element.current, {
          y: -300,
          opacity: 0,
          scale: 0.8,
          duration: ANIMATION_DURATION,
          ease: "sine.out"
        }, 0); // Start at the beginning of the timeline
      }
    });

    // Don't use setTimeout anymore - GSAP timeline handles this
  }, [cloudState?.isRevealed]);
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
    if (currentLayerRef.current !== 2 || isTransitioning.current || !layer2CloudRef.current) {
      return;
    }

    // The "accidental" wobble effect - wrong blow feedback that also applies to animate out, creating a comical look
    gsap.timeline()
      .to(layer2CloudRef.current, { x: -30, duration: 0.2, ease: "power2.out" })
      .to(layer2CloudRef.current, { x: 30, duration: 0.2, ease: "power2.out" })
      .to(layer2CloudRef.current, { x: 0, duration: 0.2, ease: "power2.out" });
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
        startListening();
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
<div 
  ref={layer3TextRef} 
  className={`${styles.textContent} ${isLayer3 ? styles.visible : ''}`}
  style={{ 
    opacity: isLayer3 ? 1 : 0,
    visibility: isLayer3 ? 'visible' : 'hidden',
    zIndex: isZoomed ? 10 : 3, // Higher z-index when zoomed, lower when in grid view
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: isZoomed ? '100%' : 'clamp(80%, 90%, 95%)', // Responsive width
    textAlign: 'center',
    pointerEvents: isZoomed ? 'auto' : 'none' // Prevent interaction when in grid view
  }}
>
  <p className={styles.finalLayerText}>
    {content.layer3}
  </p>
</div>

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