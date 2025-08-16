import React, { useState, useEffect, useCallback, useRef } from 'react';
import { gsap } from 'gsap';
import useCloudZoom from '@hooks/useCloudZoom';
import useBlowDetection from '@hooks/useBlowDetection';
import useHintDisplay from '@hooks/useHintDisplay';
import useGameStore from '@store/gameStore';
import { getRandomCloudImages } from '@data/cloudDefinitions';
import styles from './Cloud.module.css';
import AudioLevelIndicator from './AudioLevelIndicator';

const CloudA2 = ({ levelId, cloudId, position, content, onReveal }) => {
  const { getCloudState, advanceCloudLayer } = useGameStore();
  const cloudState = getCloudState(levelId, cloudId);

  const [regularCloudImage] = useState(() => getRandomCloudImages(1, 'Regular')[0]);
  const [lightCloudImage] = useState(() => getRandomCloudImages(1, 'Light')[0]);

  const [animationDelay] = useState(() => Math.random() * 10);
  const [isReverseDirection] = useState(() => Math.random() > 0.5);
  const [animationDuration] = useState(() => 8 + Math.random() * 6);

  const { cloudRef, isZoomed, isZoomingOut, handleZoomIn, handleZoomOut } = useCloudZoom(cloudState?.isRevealed);

  useHintDisplay(levelId, cloudId, isZoomed, cloudState?.isRevealed);

  const regularCloudRef = useRef(null);
  const lightCloudRef = useRef(null);
  const textContentRef = useRef(null);

  // Track blow attempts to differentiate anyblow from double blow
  const lastBlowTimeRef = useRef(null);
  const feedbackTimeoutRef = useRef(null);

  // Handle the correct blow pattern (for A2: double blow)
  const handleDoubleBlow = useCallback(() => {
    if (!isZoomed || cloudState?.isRevealed || isZoomingOut) {
      return;
    }

    // Clear any pending incorrect feedback if user succeeded
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }

    const regularCloudElement = regularCloudRef.current;
    const lightCloudElement = lightCloudRef.current;
    const textElement = textContentRef.current;

    gsap.killTweensOf([regularCloudElement, lightCloudElement, textElement].filter(Boolean));

    // Generate random direction for variety
    const randomDirection = Math.random() > 0.5 ? 1 : -1;
    const horizontalDistance = 25 * randomDirection;

    // Animate both cloud elements floating away together
    const cloudElements = [regularCloudElement, lightCloudElement].filter(Boolean);

    gsap.to(cloudElements, {
      y: -300,
      x: horizontalDistance,
      opacity: 0,
      scale: 0.8,
      duration: 0.6,
      ease: "sine.inOut"
    });

    if (textElement) {
      textElement.style.transition = 'none';
      gsap.to(textElement, {
        y: -300,
        x: horizontalDistance,
        opacity: 0,
        scale: 0.8,
        duration: 0.6,
        ease: "sine.inOut"
      });
    }

    // Update state after animation completes
    setTimeout(() => {
      advanceCloudLayer(levelId, cloudId);
      onReveal?.(cloudId);
    }, 1000);
  }, [isZoomed, isZoomingOut, cloudState?.isRevealed, advanceCloudLayer, levelId, cloudId, onReveal]);

  // Smart blow tracking: waits to see if it's part of a pattern
  const handleAnyBlowDetected = useCallback(() => {
    if (!isZoomed || cloudState?.isRevealed || isZoomingOut) {
      return;
    }

    lastBlowTimeRef.current = Date.now();

    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }

    // Set a timeout to show incorrect feedback, but only if no correct pattern is detected
    // This gives the user time to complete a double blow pattern
    feedbackTimeoutRef.current = setTimeout(() => {
      // Only show incorrect feedback if we're still in the same state
      if (!isZoomed || cloudState?.isRevealed || isZoomingOut) {
        return;
      }

      const lightCloudElement = lightCloudRef.current;
      if (!lightCloudElement) return;

      gsap.killTweensOf(lightCloudElement);

      // Create a subtle wiggle animation to indicate wrong blow type
      gsap.timeline()
        .to(lightCloudElement, {
          y: -155,
          duration: 0.35,
          ease: "sine.inOut"
        })
        .to(lightCloudElement, {
          y: 0,
          duration: 0.25,
          ease: "bounce.out"
        });

      feedbackTimeoutRef.current = null;
    }, 1200); // Wait 1.2 secs - time window for user to complete double blow

  }, [isZoomed, isZoomingOut, cloudState?.isRevealed]);

  const [audioLevel, setAudioLevel] = useState(0);

  const { startListening, stopListening } = useBlowDetection({
    onDoubleBlow: handleDoubleBlow,
    onAnyBlow: handleAnyBlowDetected,
    onLongBlow: () => { },
    onXLBlow: () => { },
    onLevelChange: setAudioLevel,
  });

  const prevZoomedRef = useRef(isZoomed);
  const prevRevealedRef = useRef(cloudState?.isRevealed);

  useEffect(() => {
    const currentRevealed = cloudState?.isRevealed;

    if (prevZoomedRef.current !== isZoomed || prevRevealedRef.current !== currentRevealed) {
      prevZoomedRef.current = isZoomed;
      prevRevealedRef.current = currentRevealed;

      const shouldListen = isZoomed && !currentRevealed;

      if (shouldListen) {
        const timeoutId = setTimeout(() => {
          startListening();
        }, 300);

        return () => {
          clearTimeout(timeoutId);
        };
      } else {
        stopListening();

        // Clean up feedback timeout when stopping listening
        if (feedbackTimeoutRef.current) {
          clearTimeout(feedbackTimeoutRef.current);
          feedbackTimeoutRef.current = null;
        }
      }
    }
  }, [isZoomed, cloudState?.isRevealed, startListening, stopListening]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  if (!cloudState) return null;

  const isLayer1 = cloudState.currentLayer === 1;
  const isLayer3 = cloudState.currentLayer === 3;

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
        {/* Layer 3 */}
        {isLayer3 && (isZoomed || cloudState?.isRevealed) && !isZoomingOut && (
          <div className={styles.textContent}>
            <p className={styles.finalLayerText}>
              {content.layer3}
            </p>
          </div>
        )}

        {/* Layer 1 - The "sandwich" structure with 3 elements */}
        {isLayer1 && (
          <>
            {/* Top layer: Light cloud (wiggles on incorrect blow) */}
            <div className={`${styles.cloudImage} ${styles.translucentCloudImage}`}>
              <img
                ref={lightCloudRef}
                src={lightCloudImage}
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

            {/* Middle layer: Text content (when zoomed) */}
            {isZoomed && !isZoomingOut && (
              <div ref={textContentRef} className={styles.textContent} style={{ zIndex: 6 }}>
                <p className={styles.regularLayerText}>
                  {content.layer1}
                </p>
                <AudioLevelIndicator
                  audioLevel={audioLevel}
                  inactiveText="Double blow to reveal"
                />
              </div>
            )}

            {/* Bottom layer: Regular cloud */}
            <div className={styles.cloudImage} style={{ zIndex: 5 }}>
              <img
                ref={regularCloudRef}
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
          </>
        )}
      </div>
    </div>
  );
};

export default CloudA2;