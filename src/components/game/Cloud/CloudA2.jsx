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
  // Add the hint functionality 
  const { getCloudState, advanceCloudLayer } = useGameStore();
  const cloudState = getCloudState(levelId, cloudId);

  // CloudA2 uses both regular and light cloud images
  const [regularCloudImage] = useState(() => getRandomCloudImages(1, 'Regular')[0]);
  const [lightCloudImage] = useState(() => getRandomCloudImages(1, 'Light')[0]);

  // Animation properties for movement variation
  const [animationDelay] = useState(() => Math.random() * 10);
  const [isReverseDirection] = useState(() => Math.random() > 0.5);
  const [animationDuration] = useState(() => 8 + Math.random() * 6);

  const { cloudRef, isZoomed, isZoomingOut, handleZoomIn, handleZoomOut } = useCloudZoom(cloudState?.isRevealed);

  // Use the centralized hint display system
  useHintDisplay(levelId, cloudId, isZoomed, cloudState?.isRevealed);

  // Separate refs for different cloud elements
  const regularCloudRef = useRef(null);
  const lightCloudRef = useRef(null);
  const textContentRef = useRef(null);

  // Handle the correct blow pattern (double blow for A2)
  const handleDoubleBlow = useCallback(() => {
    if (!isZoomed || cloudState?.isRevealed || isZoomingOut) {
      return;
    }

    const regularCloudElement = regularCloudRef.current;
    const lightCloudElement = lightCloudRef.current;
    const textElement = textContentRef.current;

    // Stop any existing animations
    gsap.killTweensOf([regularCloudElement, lightCloudElement, textElement].filter(Boolean));

    // Generate random direction for variety
    const randomDirection = Math.random() > 0.5 ? 1 : -1;
    const horizontalDistance = 50 * randomDirection;

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

    // Animate the text with the same movement
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

  // Handle incorrect blow patterns - this creates the feedback wiggle
  const handleIncorrectBlow = useCallback(() => {
    if (!isZoomed || cloudState?.isRevealed || isZoomingOut) {
      return;
    }

    const lightCloudElement = lightCloudRef.current;
    if (!lightCloudElement) return;

    // Stop any existing wiggle animations
    gsap.killTweensOf(lightCloudElement);

    // Create a subtle wiggle animation to indicate wrong blow type
    gsap.timeline()
      .to(lightCloudElement, {
        y: -150,
        duration: 0.35,
        ease: "sine.inOut"
      })
      .to(lightCloudElement, {
        y: 0,
        duration: 0.35,
        ease: "bounce.out"
      });
  }, [isZoomed, isZoomingOut, cloudState?.isRevealed]);

  const [audioLevel, setAudioLevel] = useState(0);

  const { startListening, stopListening } = useBlowDetection({
    onDoubleBlow: handleDoubleBlow, // This is the correct blow pattern for A2
    onAnyBlow: handleIncorrectBlow,  // Wrong pattern - triggers feedback
    onLongBlow: handleIncorrectBlow, // Wrong pattern - triggers feedback
    onXLBlow: handleIncorrectBlow,   // Wrong pattern - triggers feedback
    onLevelChange: setAudioLevel,
  });

  // Microphone management (same as CloudA1)
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
          startListening().then(success => {
            if (success) {
              console.log('Double blow detection activated for CloudA2');
            } else {
              console.error('Failed to activate blow detection');
            }
          });
        }, 300);

        return () => {
          clearTimeout(timeoutId);
        };
      } else {
        stopListening();

      }
    }
  }, [isZoomed, cloudState?.isRevealed, startListening, stopListening]);

  // Hint handling is now done by useHintDisplay hook

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
        {/* Layer 3 - Final revealed state */}
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
            {/* Top layer: Light cloud (this is what wiggles on incorrect blow) */}
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
                  '--floating-delay': `${animationDelay + 1}s`, // Slight offset for visual variety
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