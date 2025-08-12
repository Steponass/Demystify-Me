import React, { useState, useEffect, useCallback } from 'react';
import { gsap } from 'gsap';
import useCloudZoom from '@hooks/useCloudZoom';
import useBlowDetection from '@hooks/useBlowDetection';
import useGameStore from '@store/gameStore';
import { getRandomCloudImages } from '@data/cloudDefinitions';
import styles from './Cloud.module.css';

const CloudA1 = ({ levelId, cloudId, position, content, onReveal, onZoomChange }) => {
  const { getCloudState, advanceCloudLayer } = useGameStore();
  const cloudState = getCloudState(levelId, cloudId);

  // Simple image selection - one image per cloud
  const [cloudImage] = useState(() => getRandomCloudImages(1, 'Regular')[0]);

  const { cloudRef, isZoomed, isZoomingOut, handleZoomIn, handleZoomOut } = useCloudZoom(cloudState?.isRevealed);
  const animationRef = React.useRef(null);

  // Setup a gentle floating animation for the cloud
  useEffect(() => {
    const element = animationRef.current;

    if (element && !cloudState?.isRevealed) {
      // Very gentle floating animation
      gsap.to(element, {
        y: -5,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
    }

    return () => {
      if (element) {
        gsap.killTweensOf(element);
      }
    };
  }, [cloudState?.isRevealed]);

  const handleAnyBlow = useCallback(() => {
    console.log('Blow detected!', { isZoomed, isRevealed: cloudState?.isRevealed, isZoomingOut });

    if (!isZoomed || cloudState?.isRevealed || isZoomingOut) {
      console.log('Ignoring blow due to state conditions');
      return;
    }

    console.log('Advancing cloud layer', { levelId, cloudId });

    const element = animationRef.current;

    if (element) {
      // Stop any existing animation first
      gsap.killTweensOf(element);

      // Animate the cloud floating away and fading out
      gsap.to(element, {
        y: -300,          // Float up significantly 
        x: Math.random() > 0.5 ? 100 : -100, // Add some horizontal movement
        opacity: 0,       // Fade out
        scale: 0.7,       // Shrink slightly
        duration: 1.5,    // Over 1.5 seconds
        ease: "power2.out",
        onComplete: () => {
          // After animation completes, update the state
          advanceCloudLayer(levelId, cloudId);
          onReveal?.(cloudId);
        }
      });
    } else {
      // Fallback if ref isn't available
      advanceCloudLayer(levelId, cloudId);
      onReveal?.(cloudId);
    }
  }, [isZoomed, isZoomingOut, cloudState?.isRevealed, advanceCloudLayer, levelId, cloudId, onReveal]);

  // Add audio level state to visualize microphone input
  const [audioLevel, setAudioLevel] = useState(0);

  const { startListening, stopListening } = useBlowDetection({
    onAnyBlow: handleAnyBlow,
    onLevelChange: setAudioLevel,
  });

  // Track zoom state changes more efficiently
  const prevZoomedRef = React.useRef(isZoomed);
  const prevRevealedRef = React.useRef(cloudState?.isRevealed);

  useEffect(() => {
    // Only run when zoom state or revealed state actually changes
    const currentRevealed = cloudState?.isRevealed;

    if (prevZoomedRef.current !== isZoomed || prevRevealedRef.current !== currentRevealed) {
      prevZoomedRef.current = isZoomed;
      prevRevealedRef.current = currentRevealed;

      // Microphone should be active only when zoomed AND not revealed
      const shouldListen = isZoomed && !currentRevealed;

      if (shouldListen) {
        console.log('Cloud zoomed in and not revealed - activating blow detection');

        // Add a slight delay before activating blow detection to ensure the audio context is ready
        const timeoutId = setTimeout(() => {
          startListening().then(success => {
            if (success) {
              console.log('Blow detection activated successfully');
            } else {
              console.error('Failed to activate blow detection');
            }
          });
        }, 300);

        onZoomChange?.(true);

        return () => {
          clearTimeout(timeoutId);
        };
      } else {
        console.log('Cloud zoomed out or revealed - deactivating blow detection');
        stopListening();
        if (!isZoomed) {
          onZoomChange?.(false);
        }
      }
    }
  }, [isZoomed, cloudState?.isRevealed, startListening, stopListening, onZoomChange]);

  if (!cloudState) return null;

  // Determine if we should show Layer 1 or Layer 3
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
        {/* Layer 3 (positioned behind Layer 1) */}
        {isZoomed && !isZoomingOut && isLayer3 && (
          <div className={styles.textContent}>
            <p className={styles.finalLayerText}>
              {content.layer3}
            </p>
          </div>
        )}

        {/* Layer 1 - Cloud image */}
        {isLayer1 && (
          <div className={styles.cloudImage}>
            <img
              ref={animationRef}
              src={cloudImage}
              alt="Cloud"
              className={styles.floatingCloud}
            />
          </div>
        )}

        {/* Layer 1 - Text content */}
        {isZoomed && !isZoomingOut && isLayer1 && (
          <div className={styles.textContent}>
            <p className={styles.regularLayerText}>
              {content.layer1}
            </p>
            {/* Audio level indicator */}
            <div className={styles.audioLevelContainer}>
              <div
                className={styles.audioLevelBar}
                style={{
                  width: `${Math.min(audioLevel * 100, 100)}%`,
                  backgroundColor: audioLevel > 0.28 ? '#28a745' : '#007bff'
                }}
              />
              <span className={styles.audioLevelText}>
                {audioLevel > 0.05 ? 'Mic active' : 'Blow to reveal'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CloudA1;