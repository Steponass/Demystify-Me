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
  
  const layer1CloudRef = useRef(null);
  const layer2CloudRef = useRef(null);
  const layer1TextRef = useRef(null);
  const layer2TextRef = useRef(null);
  const layer3TextRef = useRef(null);
  
  const [audioLevel, setAudioLevel] = useState(0);
  
  // Transition lock to prevent multiple rapid transitions
  const isTransitioning = useRef(false);
  
  // Store the current layer in a ref to avoid stale closure issues
  const currentLayerRef = useRef(cloudState?.currentLayer);
  
  useEffect(() => {
    currentLayerRef.current = cloudState?.currentLayer;
  }, [cloudState?.currentLayer]);

  const handleLayer1Blow = useCallback(() => {
    if (!isZoomed || isZoomingOut || isTransitioning.current) {
      return;
    }
    
    if (currentLayerRef.current !== 1) {
      return;
    }

    isTransitioning.current = true;
    
    // Animate Layer 1 elements disappearing
    if (layer1CloudRef.current) {
      gsap.to(layer1CloudRef.current, {
        y: -300,
        opacity: 0,
        scale: 0.8,
        duration: 0.6,
        ease: "sine.out"
      });
    }
    if (layer1TextRef.current) {
      gsap.to(layer1TextRef.current, {
        y: -300,
        opacity: 0,
        scale: 0.8,
        duration: 0.6,
        ease: "sine.out"
      });
    }

    // Update state after animation
    setTimeout(() => {
      advanceCloudLayer(levelId, cloudId);
      setTimeout(() => {
        isTransitioning.current = false;
      }, 300); // Give time for state to settle
    }, 600);
  }, [isZoomed, isZoomingOut, advanceCloudLayer, levelId, cloudId]);

  const handleLayer2LongBlow = useCallback(() => {
    if (!isZoomed || isZoomingOut || isTransitioning.current) {;
      return;
    }
    
    // Check current layer at the moment of execution
    if (currentLayerRef.current !== 2) {
      return;
    }

    isTransitioning.current = true;
    
    // Animate Layer 2 elements disappearing
    if (layer2CloudRef.current) {
      gsap.to(layer2CloudRef.current, {
        y: -300,
        opacity: 0,
        scale: 0.8,
        duration: 0.6,
        ease: "sine.out"
      });
    }
    
    if (layer2TextRef.current) {
      gsap.to(layer2TextRef.current, {
        y: -300,
        opacity: 0,
        scale: 0.8,
        duration: 0.6,
        ease: "sine.out"
      });
    }

    setTimeout(() => {
      advanceCloudLayer(levelId, cloudId);
      onReveal?.(cloudId);
      isTransitioning.current = false;
    }, 500);
  }, [isZoomed, isZoomingOut, advanceCloudLayer, levelId, cloudId, onReveal]);

  // Layer 2 feedback for wrong blow types
  const handleLayer2Feedback = useCallback(() => {
    if (currentLayerRef.current !== 2 || isTransitioning.current) {
      return;
    }
    
    if (layer2TextRef.current) {
      gsap.timeline()
        .to(layer2CloudRef.current, { x: -30, duration: 0.2, ease: "power2.out" })
        .to(layer2CloudRef.current, { x: 30, duration: 0.2, ease: "power2.out" })
        .to(layer2CloudRef.current, { x: 0, duration: 0.2, ease: "power2.out" });
    }
  }, []);

  // Blow detection with explicit current layer checks and clearer logging
  const { startListening, stopListening } = useBlowDetection({
    onAnyBlow: () => {
      const currentLayer = currentLayerRef.current;
      
      if (currentLayer === 1) {
        handleLayer1Blow();
      } else if (currentLayer === 2) {
        handleLayer2Feedback();
      }
    },
    onLongBlow: () => {
      const currentLayer = currentLayerRef.current;
      
      if (currentLayer === 1) {
        handleLayer1Blow();
      } else if (currentLayer === 2) {
        handleLayer2LongBlow();
      }
    },
    onDoubleBlow: () => {
      const currentLayer = currentLayerRef.current;
      if (currentLayer === 2) {
        handleLayer2Feedback();
      }
    },
    onXLBlow: () => {
      const currentLayer = currentLayerRef.current;
      if (currentLayer === 2) {
        handleLayer2Feedback();
      }
    },
    onLevelChange: setAudioLevel
  });

  // Effect to show Layer 2 content
  useEffect(() => {
    if (cloudState?.currentLayer === 2 && isZoomed && !isTransitioning.current) {
      console.log('CloudB1: Animating Layer 2 content in');
      
      if (layer2CloudRef.current) {
        gsap.fromTo(layer2CloudRef.current,
          { opacity: 0.8},
          { opacity: 1}
        );
      }
      
      if (layer2TextRef.current) {
        gsap.fromTo(layer2TextRef.current,
          { opacity: 0.8},
          { opacity: 1, duration: 0.2, ease: "sine.out" }
        );
      }
    }
  }, [cloudState?.currentLayer, isZoomed]);

  // Simplified microphone lifecycle - only start/stop based on zoom and reveal status
  const prevZoomedRef = useRef(isZoomed);
  const prevRevealedRef = useRef(cloudState?.isRevealed);

  useEffect(() => {
    const currentRevealed = cloudState?.isRevealed;
    const shouldListen = isZoomed && !currentRevealed;

    // Only restart microphone when zoom state or revealed state changes
    if (prevZoomedRef.current !== isZoomed || prevRevealedRef.current !== currentRevealed) {
      
      prevZoomedRef.current = isZoomed;
      prevRevealedRef.current = currentRevealed;

      if (shouldListen) {
        const timeoutId = setTimeout(() => {
          startListening().then(success => {
            if (success) {
              console.log(`CloudB1: Microphone active for Layer ${cloudState?.currentLayer}`);
            } else {
              console.error('CloudB1: Failed to start microphone');
            }
          });
        }, 100);

        onZoomChange?.(true);

        return () => {
          clearTimeout(timeoutId);
        };
      } else {
        console.log('CloudB1: Stopping microphone');
        stopListening();
        if (!isZoomed) {
          onZoomChange?.(false);
        }
      }
    }
  }, [isZoomed, cloudState?.isRevealed, startListening, stopListening, onZoomChange, cloudState?.currentLayer]);

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

        {/* Layer 2 - Intermediate state with Heavy cloud */}
        {isLayer2 && isZoomed && !isZoomingOut && (
          <>
            <div className={styles.cloudImage}>
              <img
                ref={layer2CloudRef}
                src={heavyCloudImage}
                className={styles.floatingCloud}
                
              />
            </div>
            <div ref={layer2TextRef} className={styles.textContent} >
              <p className={styles.regularLayerText}>
                {content.layer2}
              </p>
              <AudioLevelIndicator
                audioLevel={audioLevel}
                inactiveText={getAudioIndicatorText()}
              />
            </div>
          </>
        )}

        {/* Layer 1 - Initial state with Regular cloud */}
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