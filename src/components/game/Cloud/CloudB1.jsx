import React, { useState, useEffect, useCallback, useRef } from 'react';
import { gsap } from 'gsap';
import useCloudZoom from '@hooks/useCloudZoom';
import useBlowDetection from '@hooks/useBlowDetection';
import useGameStore from '@store/gameStore';
import { getRandomCloudImages } from '@data/cloudDefinitions';
import styles from './Cloud.module.css';
import AudioLevelIndicator from './AudioLevelIndicator';

const CloudB1 = ({ levelId, cloudId, position, content, onReveal, onZoomChange }) => {
  const { getCloudState, advanceCloudLayer } = useGameStore();
  const cloudState = getCloudState(levelId, cloudId);

  const [regularCloudImage] = useState(() => getRandomCloudImages(1, 'Regular')[0]);
  const [heavyCloudImage] = useState(() => getRandomCloudImages(1, 'Heavy')[0]);
  const [animationDelay] = useState(() => Math.random() * 10);
  const [isReverseDirection] = useState(() => Math.random() > 0.5);
  const [animationDuration] = useState(() => 8 + Math.random() * 6);

  const { cloudRef, isZoomed, isZoomingOut, handleZoomIn, handleZoomOut } = useCloudZoom(cloudState?.isRevealed);

  // State variables
  const [audioLevel, setAudioLevel] = useState(0);
  // Store current layer in state to ensure it's always up-to-date
  const [currentLayer, setCurrentLayer] = useState(cloudState?.currentLayer);

  // Update layer state when cloudState changes
  useEffect(() => {
    setCurrentLayer(cloudState?.currentLayer);
    console.log(`Layer updated to: ${cloudState?.currentLayer}`);
  }, [cloudState?.currentLayer]);

  // Separate refs for each visual element to prevent conflicts
  const layer1CloudRef = useRef(null);
  const layer2CloudRef = useRef(null);
  const layer1TextRef = useRef(null);
  const layer2TextRef = useRef(null);
  const layer3TextRef = useRef(null);
  // For debugging
  const blowsDetectedRef = useRef({ any: 0, long: 0 });
  const handleAnyBlow = useCallback(() => {
    if (!isZoomed || isZoomingOut) {
      return;
    }

    console.log(`handleAnyBlow called with currentLayer = ${currentLayer}`);

    // IMPORTANT: This function is ONLY FOR LAYER 1
    // Layer 2 should NEVER use this function
    if (currentLayer !== 1) {
      console.log('PREVENTED: handleAnyBlow called on incorrect layer', currentLayer);
      return; // Exit immediately if not on Layer 1
    }

    // Handle Layer 1 → Layer 2 transition
    console.log('CloudB1: Advancing from Layer 1 to Layer 2');

    // Kill any existing animations
    gsap.killTweensOf([layer1CloudRef.current, layer1TextRef.current].filter(Boolean));

    // Animate cloud image disappearing
    if (layer1CloudRef.current) {
      gsap.to(layer1CloudRef.current, {
        y: -300,
        opacity: 0,
        scale: 0.8,
        duration: 0.6,
        ease: "sine.inOut"
      });
    }

    // Animate Layer 1 text disappearing
    if (layer1TextRef.current) {
      gsap.to(layer1TextRef.current, {
        y: -300,
        opacity: 0,
        scale: 0.8,
        duration: 0.6,
        ease: "sine.inOut"
      });
    }

    // Update state to Layer 2
    setTimeout(() => {
      advanceCloudLayer(levelId, cloudId);
    }, 100);
  }, [isZoomed, isZoomingOut, currentLayer, advanceCloudLayer, levelId, cloudId]);

  // Handle Layer 2 → Layer 3 transition
  const handleLongBlow = useCallback(() => {
    if (!isZoomed || isZoomingOut) {
      return;
    }

    console.log(`handleLongBlow called with currentLayer = ${currentLayer}`);

    // IMPORTANT: This function is ONLY FOR LAYER 2
    // It should NEVER be called directly on Layer 1
    if (currentLayer !== 2) {
      console.log('PREVENTED: handleLongBlow called on incorrect layer', currentLayer);
      return; // Exit immediately if not on Layer 2
    }

    // Layer 2: Long blow advances to Layer 3
    console.log('CloudB1: Advancing from Layer 2 to Layer 3 with LONG blow');

    // Animate Layer 2 text transforming
    if (layer2TextRef.current) {
      gsap.timeline()
        .to(layer2TextRef.current, {
          y: -300,
          opacity: 0,
          scale: 0.8,
          duration: 0.6,
          ease: "sine.inOut"
        })
        .to(layer2TextRef.current, {
          y: -300,
          opacity: 0,
          scale: 0.8,
          duration: 0.6,
          ease: "sine.inOut"
        });
    }

    // Update state to Layer 3
    setTimeout(() => {
      advanceCloudLayer(levelId, cloudId);
      onReveal?.(cloudId);
    }, 300);
  }, [isZoomed, isZoomingOut, currentLayer, advanceCloudLayer, levelId, cloudId, onReveal]);

  // Show Layer 2 text when we transition to Layer 2
  useEffect(() => {
    if (currentLayer === 2 && isZoomed && layer2TextRef.current) {
      console.log('CloudB1: Showing Layer 2 content');
      gsap.fromTo(layer2TextRef.current,
        { opacity: 0.8 },
        { opacity: 1, y: 0, duration: 0.3, ease: "sine.out" }
      );
    }
  }, [currentLayer, isZoomed]);

  // Create separate handlers for each layer
  const handleLayer1Blow = useCallback(() => {
    // Strict layer check - ONLY for Layer 1
    if (currentLayer !== 1) {
      console.log('PREVENTED: handleLayer1Blow called while not on Layer 1');
      return;
    }

    console.log('Layer 1 specific blow handler executing');
    handleAnyBlow();
  }, [currentLayer, handleAnyBlow]);

  const handleLayer2LongBlow = useCallback(() => {
    // Strict layer check - ONLY for Layer 2
    if (currentLayer !== 2) {
      console.log('PREVENTED: handleLayer2LongBlow called while not on Layer 2');
      return;
    }

    console.log('Layer 2 specific long blow handler executing');
    handleLongBlow();
  }, [currentLayer, handleLongBlow]);

  const { startListening, stopListening } = useBlowDetection({
    // Create a custom any blow handler that ONLY triggers Layer 1 transitions
    // and completely ignores any blows on Layer 2
    onAnyBlow: () => {
      // Log for debugging
      blowsDetectedRef.current.any++;
      console.log(`Any blow detected on layer ${currentLayer}, count: ${blowsDetectedRef.current.any}`);

      // CRITICAL FIX: ONLY process for Layer 1
      // This ensures Layer 2 never responds to regular/any blows
      if (currentLayer === 1) {
        handleLayer1Blow();
      } else {
        console.log(`Ignoring any blow on layer ${currentLayer} - not applicable`);
      }
    },
    // Long blow handler that works differently for each layer
    onLongBlow: () => {
      // Log for debugging
      blowsDetectedRef.current.long++;
      console.log(`Long blow detected on layer ${currentLayer}, count: ${blowsDetectedRef.current.long}`);

      // For Layer 1, we don't need special long blow handling (any blow is enough)
      // For Layer 2, ONLY process long blows
      if (currentLayer === 2) {
        handleLayer2LongBlow();
      } else {
        console.log(`Long blow on layer ${currentLayer} handled via appropriate layer handler`);
      }
    },
    // Don't do anything for double or XL blows
    onDoubleBlow: () => { },
    onXLBlow: () => { },
    onLevelChange: setAudioLevel,
  });  // Microphone lifecycle management
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
              console.log('Sequential blow detection activated for CloudB1');
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
        stopListening();
        if (!isZoomed) {
          onZoomChange?.(false);
        }
      }
    }
  }, [isZoomed, cloudState?.isRevealed, startListening, stopListening, onZoomChange]);

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
        {/* Layer 3 - Final revealed state */}
        {isLayer3 && (isZoomed || cloudState?.isRevealed) && !isZoomingOut && (
          <div ref={layer3TextRef} className={styles.textContent}>
            <p className={styles.finalLayerText}>
              {content.layer3}
            </p>
          </div>
        )}

        {/* Layer 2 - Intermediate state */}
        {isLayer2 && isZoomed && !isZoomingOut && (
          <div>
            <div className={styles.cloudImage}>
              <img
                ref={layer2CloudRef}
                src={heavyCloudImage}
                className={styles.floatingCloud}
              />
            </div>
            <div ref={layer2TextRef} className={styles.textContent} style={{ opacity: 0 }}>
              <p className={styles.regularLayerText}>
                {content.layer2}
              </p>
              <AudioLevelIndicator
                audioLevel={audioLevel}
                inactiveText={getAudioIndicatorText()}
              />
            </div>
          </div>
        )}

        {/* Layer 1 - Initial state */}
        {isLayer1 && (
          <>
            <div className={styles.cloudImage}>
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