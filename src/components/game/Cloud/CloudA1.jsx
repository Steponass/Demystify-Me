import React, { useState, useEffect, useCallback } from 'react';
import useCloudZoom from '@hooks/useCloudZoom';
import useBlowDetection from '@hooks/useBlowDetection';
import useHintDisplay from '@hooks/useHintDisplay';
import useGameStore from '@store/gameStore';
import { getRandomCloudImages } from '@data/cloudDefinitions';
import styles from './Cloud.module.css';
import Layer3Text from './Layer3Text';
import { MICROPHONE_START_DELAY } from './constants/cloudConstants';
import { createLayer3Timeline, animateElementsOut, startBlowDetectionWithErrorHandling } from './utils/cloudAnimations';

const CloudA1 = ({ levelId, cloudId, position, content, onReveal, containerRef }) => {
  const { getCloudState, advanceCloudLayer, getBlowThreshold } = useGameStore();
  const cloudState = getCloudState(levelId, cloudId);

  const [cloudImage] = useState(() => getRandomCloudImages(1, 'Regular')[0]);

  const [isReverseDirection] = useState(() => Math.random() > 0.5);
  const [animationDuration] = useState(() => 8 + Math.random() * 6); // 8-14 seconds
  const [isExitAnimating, setIsExitAnimating] = useState(false);

  const { cloudRef, isZoomed, isZoomingOut, handleZoomIn, handleZoomOut } =
    useCloudZoom(cloudState?.isRevealed);

  useHintDisplay(levelId, cloudId, isZoomed, cloudState?.isRevealed, cloudId);

  const animationRef = React.useRef(null);
  const textContentRef = React.useRef(null);
  const layer3TextRef = React.useRef(null);

  const handleAnyBlow = useCallback(() => {
    if (!isZoomed || cloudState?.isRevealed || isZoomingOut) {
      return;
    }

    // Hide text immediately when blow is detected
    if (textContentRef.current) {
      textContentRef.current.style.display = 'none';
    }

    // Disable CSS floating animation before GSAP takes over
    setIsExitAnimating(true);
    
    const timeline = createLayer3Timeline(
      layer3TextRef.current,
      () => {
        advanceCloudLayer(levelId, cloudId);
        onReveal?.(cloudId);
      }
    );

    // Only animate the cloud image out, not the text
    animateElementsOut([animationRef], timeline);
  }, [
    isZoomed,
    isZoomingOut,
    cloudState?.isRevealed,
    advanceCloudLayer,
    levelId,
    cloudId,
    onReveal,
  ]);


  const { startListening, stopListening } = useBlowDetection({
    onAnyBlow: handleAnyBlow,
    blowThreshold: getBlowThreshold(),
  });

  // Track zoom state changes
  const prevZoomedRef = React.useRef(isZoomed);
  const prevRevealedRef = React.useRef(cloudState?.isRevealed);
  const micTimeoutRef = React.useRef(null);

  useEffect(() => {
    // Only run when zoom state or revealed state changes
    const currentRevealed = cloudState?.isRevealed;

    if (
      prevZoomedRef.current !== isZoomed ||
      prevRevealedRef.current !== currentRevealed
    ) {
      prevZoomedRef.current = isZoomed;
      prevRevealedRef.current = currentRevealed;

      // Clear any pending timeout first
      if (micTimeoutRef.current) {
        clearTimeout(micTimeoutRef.current);
        micTimeoutRef.current = null;
      }

      // Microphone active only when zoomed AND not revealed
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
        className={`${styles.cloud} ${
          cloudState.isRevealed ? styles.revealed : ""
        } ${isZoomed ? styles.zoomed : ""}`}
        onClick={
          !isZoomed
            ? handleZoomIn
            : cloudState?.isRevealed
            ? handleZoomOut
            : undefined
        }
        data-flip-id={cloudId}
      >
        <Layer3Text
          layer3TextRef={layer3TextRef}
          content={content.layer3}
          isLayer3={isLayer3}
          isZoomed={isZoomed}
          isZoomingOut={isZoomingOut}
        />

        {/* Layer 1 */}
        {isLayer1 && (
          <div className={styles.cloudImage}>
            <img
              ref={animationRef}
              src={cloudImage}
              className={`${styles.floatingCloud} ${
                !cloudState?.isRevealed && !isExitAnimating
                  ? isReverseDirection
                    ? styles.floatingReverse
                    : styles.floating
                  : ""
              }`}
              style={{
                "--floating-duration": `${animationDuration}s`,
              }}
            />
          </div>
        )}

        {/* Layer 1 - Text content */}
        {isZoomed && !isZoomingOut && isLayer1 && (
          <div ref={textContentRef} className={styles.textContent}>
            <p className={styles.regularLayerText}>{content.layer1}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CloudA1;
