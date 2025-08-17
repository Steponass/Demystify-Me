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
import { MICROPHONE_START_DELAY, FEEDBACK_TIMEOUT_DELAY } from './constants/cloudConstants';
import { createLayer3Timeline, animateElementsOut, startBlowDetectionWithErrorHandling } from './utils/cloudAnimations';

const CloudA2 = ({ levelId, cloudId, position, content, onReveal, animationDelay = 0, containerRef }) => {
  const { getCloudState, advanceCloudLayer } = useGameStore();
  const cloudState = getCloudState(levelId, cloudId);

  const [regularCloudImage] = useState(() => getRandomCloudImages(1, 'Regular')[0]);
  const [lightCloudImage] = useState(() => getRandomCloudImages(1, 'Light')[0]);

  const [isReverseDirection] = useState(() => Math.random() > 0.5);
  const [animationDuration] = useState(() => 8 + Math.random() * 6);

  const { cloudRef, isZoomed, isZoomingOut, handleZoomIn, handleZoomOut } = useCloudZoom(cloudState?.isRevealed);

  useHintDisplay(levelId, cloudId, isZoomed, cloudState?.isRevealed);

  const regularCloudRef = useRef(null);
  const lightCloudRef = useRef(null);
  const textContentRef = useRef(null);
  const layer3TextRef = useRef(null); // Add ref for layer 3 content

  // Track blow attempts to differentiate anyblow from double blow
  const lastBlowTimeRef = useRef(null);
  const feedbackTimeoutRef = useRef(null);

  const handleDoubleBlow = useCallback(() => {
    if (!isZoomed || cloudState?.isRevealed || isZoomingOut) {
      return;
    }

    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }

    const timeline = createLayer3Timeline(
      layer3TextRef.current,
      () => {
        advanceCloudLayer(levelId, cloudId);
        onReveal?.(cloudId);
      }
    );

    animateElementsOut([regularCloudRef, lightCloudRef, textContentRef], timeline);
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

    feedbackTimeoutRef.current = setTimeout(() => {
      if (!isZoomed || cloudState?.isRevealed || isZoomingOut) {
        return;
      }

      const lightCloudElement = lightCloudRef.current;
      if (!lightCloudElement) return;

      gsap.killTweensOf(lightCloudElement);

      gsap.timeline()
        .to(lightCloudElement, {
          y: -155,
          duration: 0.35,
          ease: 'sine.inOut'
        })
        .to(lightCloudElement, {
          y: 0,
          duration: 0.25,
          ease: 'bounce.out'
        });

      feedbackTimeoutRef.current = null;
    }, FEEDBACK_TIMEOUT_DELAY);

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
  const micTimeoutRef = useRef(null);

  useEffect(() => {
    const currentRevealed = cloudState?.isRevealed;

    if (prevZoomedRef.current !== isZoomed || prevRevealedRef.current !== currentRevealed) {
      prevZoomedRef.current = isZoomed;
      prevRevealedRef.current = currentRevealed;

      // Clear any pending timeout first
      if (micTimeoutRef.current) {
        clearTimeout(micTimeoutRef.current);
        micTimeoutRef.current = null;
      }

      const shouldListen = isZoomed && !currentRevealed;

      if (shouldListen) {
        micTimeoutRef.current = setTimeout(() => {
          startBlowDetectionWithErrorHandling(startListening);
          micTimeoutRef.current = null;
        }, MICROPHONE_START_DELAY);
      } else {
        stopListening();
      }
    }

    return () => {
      if (micTimeoutRef.current) {
        clearTimeout(micTimeoutRef.current);
        micTimeoutRef.current = null;
      }
    };
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
      ref={containerRef}
      className={styles.cloudContainer}
      style={{
        left: position?.x,
        top: position?.y,
        animationDelay: `${animationDelay}s`
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