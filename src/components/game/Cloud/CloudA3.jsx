import React, { useState, useEffect, useCallback, useRef } from 'react';
import useCloudZoom from '@hooks/useCloudZoom';
import useBlowDetection from '@hooks/useBlowDetection';
import useHintDisplay from '@hooks/useHintDisplay';
import useGameStore from '@store/gameStore';
import useHintStore from '@store/hintStore';
import { getRandomCloudImages } from '@data/cloudDefinitions';
import styles from './Cloud.module.css';
import Layer3Text from './Layer3Text';
import { MICROPHONE_START_DELAY } from './constants/cloudConstants';
import { createLayer3Timeline, animateElementsOut, createFeedbackWiggle, startBlowDetectionWithErrorHandling } from './utils/cloudAnimations';

const CloudA3 = ({ levelId, cloudId, position, content, onReveal, containerRef }) => {
  const { getCloudState, advanceCloudLayer, getBlowThreshold } = useGameStore();
  const incrementIncorrectBlow = useHintStore(state => state.incrementIncorrectBlow);
  const resetIncorrectBlowsForCloud = useHintStore(state => state.resetIncorrectBlowsForCloud);
  const cloudState = getCloudState(levelId, cloudId);

  const [cloudImage] = useState(() => getRandomCloudImages(1, 'Heavy')[0]);

  const [isReverseDirection] = useState(() => Math.random() > 0.5);
  const [animationDuration] = useState(() => 8 + Math.random() * 6);
  const [isExitAnimating, setIsExitAnimating] = useState(false);

  const { cloudRef, isZoomed, isZoomingOut, handleZoomIn, handleZoomOut } = useCloudZoom(cloudState?.isRevealed, cloudId);
  
  // Track zoom state to reset incorrect blows when zooming out
  const prevZoomedStateRef = useRef(isZoomed);
  
  useEffect(() => {
    // Reset incorrect blows when transitioning from zoomed to not zoomed
    if (prevZoomedStateRef.current && !isZoomed) {
      resetIncorrectBlowsForCloud(levelId, cloudId);
    }
    prevZoomedStateRef.current = isZoomed;
  }, [isZoomed, resetIncorrectBlowsForCloud, levelId, cloudId]);

  // Use the centralized hint display system
  useHintDisplay(levelId, cloudId, isZoomed, cloudState?.isRevealed);

  const animationRef = useRef(null);
  const textContentRef = useRef(null);
  const layer3TextRef = useRef(null); // Add ref for layer 3 content

  const handleXLBlow = useCallback(() => {
    if (!isZoomed || cloudState?.isRevealed || isZoomingOut) {
      return;
    }

    // Hide text immediately when blow is detected
    if (textContentRef.current) {
      textContentRef.current.style.display = 'none';
    }

    const timeline = createLayer3Timeline(
      layer3TextRef.current,
      () => {
        advanceCloudLayer(levelId, cloudId);
        onReveal?.(cloudId);
      }
    );

    // Disable CSS floating animation just before GSAP takes over
    setIsExitAnimating(true);

    // Only animate the cloud image out, not the text
    animateElementsOut([animationRef], timeline);
  }, [isZoomed, isZoomingOut, cloudState?.isRevealed, advanceCloudLayer, levelId, cloudId, onReveal]);

  const handleIncorrectBlow = useCallback(() => {
    if (!isZoomed || cloudState?.isRevealed || isZoomingOut) {
      return;
    }

    // Increment incorrect blow count for hint system
    if (cloudState?.cloudType) {
      incrementIncorrectBlow(levelId, cloudId, cloudState.cloudType);
    }

    // Disable CSS floating after first incorrect blow to avoid CSS-GSAP conflicts
    setIsExitAnimating(true);
    
    createFeedbackWiggle(animationRef, 'heavy');
  }, [isZoomed, isZoomingOut, cloudState?.isRevealed, cloudState?.cloudType, incrementIncorrectBlow, levelId, cloudId]);


  const { startListening, stopListening } = useBlowDetection({
    onXLBlow: handleXLBlow,
    onAnyBlow: handleIncorrectBlow,
    onDoubleBlow: handleIncorrectBlow,
    onLongBlow: handleIncorrectBlow,
    blowThreshold: getBlowThreshold(),
  });

  // Microphone management
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

        {/* Layer 1 - Initial state with resistant cloud */}
        {isLayer1 && (
          <>
            {/* Text content when zoomed */}
            {isZoomed && !isZoomingOut && (
              <div ref={textContentRef} className={styles.textContent}>
                <p className={styles.regularLayerText}>
                  {content.layer1}
                </p>
              </div>
            )}

            {/* Cloud image */}
            <div className={styles.cloudImage}>
              <img
                ref={animationRef}
                src={cloudImage}
                className={`${styles.floatingCloud} ${!cloudState?.isRevealed && !isExitAnimating
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

export default CloudA3;