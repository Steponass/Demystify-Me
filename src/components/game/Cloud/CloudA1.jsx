import React, { useState, useEffect, useCallback } from 'react';
import { gsap } from 'gsap';
import useCloudZoom from '@hooks/useCloudZoom';
import useBlowDetection from '@hooks/useBlowDetection';
import useHintDisplay from '@hooks/useHintDisplay';
import useGameStore from '@store/gameStore';
import { getRandomCloudImages } from '@data/cloudDefinitions';
import styles from './Cloud.module.css';
import AudioLevelIndicator from './AudioLevelIndicator';

const CloudA1 = ({ levelId, cloudId, position, content, onReveal }) => {
  const { getCloudState, advanceCloudLayer } = useGameStore();
  const cloudState = getCloudState(levelId, cloudId);

  const [cloudImage] = useState(() => getRandomCloudImages(1, 'Regular')[0]);

  // Generate random animation properties for movement variation
  const [animationDelay] = useState(() => Math.random() * 10);
  const [isReverseDirection] = useState(() => Math.random() > 0.5);
  const [animationDuration] = useState(() => 8 + Math.random() * 6); // 8-14 seconds

  const { cloudRef, isZoomed, isZoomingOut, handleZoomIn, handleZoomOut } = useCloudZoom(cloudState?.isRevealed);

  // Use the centralized hint display system
  useHintDisplay(levelId, cloudId, isZoomed, cloudState?.isRevealed);

  const animationRef = React.useRef(null);
  const textContentRef = React.useRef(null);
  const layer3TextRef = React.useRef(null); // Add ref for layer 3 content

  const handleAnyBlow = useCallback(() => {
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

if (layer3Element) {
  // Use set for positioning to avoid any movement
  gsap.set(layer3Element, { 
    opacity: 0, 
    display: 'block', 
    visibility: 'visible',
    // Don't change position properties during animation
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 10
  });
  
  // Only animate opacity, not position
  timeline.to(layer3Element, {
    opacity: 1,
    duration: 0.3,
    ease: "sine.in"
  }, 0);
}

    if (cloudElement) {
      // Stop any existing animation first
      gsap.killTweensOf(cloudElement);
      
      // Generate random direction for variety
      const randomDirection = Math.random() > 0.5 ? 1 : -1;
      const horizontalDistance = 50 * randomDirection;

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
        x: 50, // Match the cloud movement
        opacity: 0,
        scale: 0.8,
        duration: 0.6,
        ease: "sine.inOut"
      }, 0); // Start at the beginning of the timeline
    }

    // No need for setTimeout as the timeline handles the callback
  }, [isZoomed, isZoomingOut, cloudState?.isRevealed, advanceCloudLayer, levelId, cloudId, onReveal]);

  // Add audio level state to visualize microphone input
  const [audioLevel, setAudioLevel] = useState(0);

  const { startListening, stopListening } = useBlowDetection({
    onAnyBlow: handleAnyBlow,
    onLevelChange: setAudioLevel,
  });

  // Track zoom state changes
  const prevZoomedRef = React.useRef(isZoomed);
  const prevRevealedRef = React.useRef(cloudState?.isRevealed);

  useEffect(() => {
    // Only run when zoom state or revealed state changes
    const currentRevealed = cloudState?.isRevealed;

    if (prevZoomedRef.current !== isZoomed || prevRevealedRef.current !== currentRevealed) {
      prevZoomedRef.current = isZoomed;
      prevRevealedRef.current = currentRevealed;

      // Microphone active only when zoomed AND not revealed
      const shouldListen = isZoomed && !currentRevealed;

      if (shouldListen) {
        // Delay before activating blow detection to ensure audio context is ready
        const timeoutId = setTimeout(() => {
          startListening().then(success => {
            if (success) {
              console.log('Blow detection activated successfully');
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

        {/* Layer 1 - Cloud image (only visible if not revealed or if still on layer 1) */}
        {isLayer1 && (
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
        )}

        {/* Layer 1 - Text content */}
        {isZoomed && !isZoomingOut && isLayer1 && (
          <div ref={textContentRef} className={styles.textContent}>
            <p className={styles.regularLayerText}>
              {content.layer1}
            </p>
            <AudioLevelIndicator audioLevel={audioLevel} />
          </div>
        )}
      </div>
    </div>
  );
};

export default CloudA1;