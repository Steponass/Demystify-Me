import React, { useState, useEffect, useCallback, useRef } from 'react';
import { gsap } from 'gsap';
import useCloudZoom from '@hooks/useCloudZoom';
import useBlowDetection from '@hooks/useBlowDetection';
import useHintDisplay from '@hooks/useHintDisplay';
import useGameStore from '@store/gameStore';
import { getRandomCloudImages } from '@data/cloudDefinitions';
import styles from './Cloud.module.css';
import AudioLevelIndicator from './AudioLevelIndicator';

const CloudA3 = ({ levelId, cloudId, position, content, onReveal }) => {
  const { getCloudState, advanceCloudLayer } = useGameStore();
  const cloudState = getCloudState(levelId, cloudId);

  const [cloudImage] = useState(() => getRandomCloudImages(1, 'Regular')[0]);

  const [animationDelay] = useState(() => Math.random() * 10);
  const [isReverseDirection] = useState(() => Math.random() > 0.5);
  const [animationDuration] = useState(() => 8 + Math.random() * 6);

  const { cloudRef, isZoomed, isZoomingOut, handleZoomIn, handleZoomOut } = useCloudZoom(cloudState?.isRevealed);

  // Use the centralized hint display system
  useHintDisplay(levelId, cloudId, isZoomed, cloudState?.isRevealed);

  const animationRef = useRef(null);
  const textContentRef = useRef(null);
  const layer3TextRef = useRef(null); // Add ref for layer 3 content

  // Handle the correct blow pattern (XL blow for A3)
  const handleXLBlow = useCallback(() => {
    if (!isZoomed || cloudState?.isRevealed || isZoomingOut) {
      return;
    }

    const cloudElement = animationRef.current;
    const textElement = textContentRef.current;
    const layer3Element = layer3TextRef.current;

    // Create a GSAP timeline for coordinated animations
    const timeline = gsap.timeline({
      onComplete: () => {
        // Update state after animation completes
        advanceCloudLayer(levelId, cloudId);
        onReveal?.(cloudId);
      }
    });

    // First, make Layer 3 visible but initially transparent
    if (layer3Element) {
      gsap.set(layer3Element, { 
        opacity: 0, 
        display: 'block', 
        visibility: 'visible',
        zIndex: 10 // Above other elements
      });
      
      // Fade in Layer 3 immediately
      timeline.to(layer3Element, {
        opacity: 1,
        duration: 0.3,
        ease: "sine.in"
      }, 0); // Start at the beginning of the timeline
    }

    if (cloudElement) {
      // Stop any existing animation first
      gsap.killTweensOf(cloudElement);
      
      // Generate random direction for variety
      const randomDirection = Math.random() > 0.5 ? 1 : -1;
      const horizontalDistance = 25 * randomDirection;

      // Add cloud animation to the timeline
      timeline.to(cloudElement, {
        y: -300,
        x: horizontalDistance,
        opacity: 0,
        scale: 0.8,
        duration: 0.6,
        ease: "sine.inOut"
      }, 0); // Start at the beginning of the timeline
    }

    // Animate the text with the same movement if it exists
    if (textElement) {
      // Clear any CSS transitions first
      textElement.style.transition = 'none';
      gsap.killTweensOf(textElement);

      // Add text animation to the timeline
      timeline.to(textElement, {
        y: -300,
        x: 25, // Match the cloud movement
        opacity: 0,
        scale: 0.8,
        duration: 0.6,
        ease: "sine.inOut"
      }, 0); // Start at the beginning of the timeline
    }

    // No need for setTimeout as the timeline handles the callback
  }, [isZoomed, isZoomingOut, cloudState?.isRevealed, advanceCloudLayer, levelId, cloudId, onReveal]);

  // Handle incorrect blow patterns - creates the feedback wiggle
  const handleIncorrectBlow = useCallback(() => {
    if (!isZoomed || cloudState?.isRevealed || isZoomingOut) {
      return;
    }

    const cloudElement = animationRef.current;
    if (!cloudElement) return;

    // Stop any existing wiggle animations
    gsap.killTweensOf(cloudElement);

    // Create a subtle wiggle animation to indicate wrong blow type
    // Similar to CloudB1 Layer 2 feedback but more resistant
    gsap.timeline()
      .to(cloudElement, {
        x: -40,
        rotation: -5,
        duration: 0.2,
        ease: "power2.out"
      })
      .to(cloudElement, {
        x: 40,
        rotation: 5,
        duration: 0.25,
        ease: "power2.out"
      })
      .to(cloudElement, {
        x: -20,
        rotation: -2,
        duration: 0.2,
        ease: "power2.out"
      })
      .to(cloudElement, {
        x: 0,
        rotation: 0,
        duration: 0.25,
        ease: "bounce.out"
      });
  }, [isZoomed, isZoomingOut, cloudState?.isRevealed]);

  const [audioLevel, setAudioLevel] = useState(0);

  const { startListening, stopListening } = useBlowDetection({
    onXLBlow: handleXLBlow,
    onAnyBlow: handleIncorrectBlow,
    onDoubleBlow: handleIncorrectBlow,
    onLongBlow: handleIncorrectBlow,
    onLevelChange: setAudioLevel,
  });

  // Microphone management
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
              console.log('XL blow detection activated for CloudA3');
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

        {/* Layer 1 - Initial state with resistant cloud */}
        {isLayer1 && (
          <>
            {/* Text content when zoomed */}
            {isZoomed && !isZoomingOut && (
              <div ref={textContentRef} className={styles.textContent}>
                <p className={styles.regularLayerText}>
                  {content.layer1}
                </p>
                <AudioLevelIndicator
                  audioLevel={audioLevel}
                  inactiveText="XL blow to breakthrough"
                />
              </div>
            )}

            {/* Cloud image */}
            <div className={styles.cloudImage}>
              <img
                ref={animationRef}
                src={cloudImage}
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

export default CloudA3;