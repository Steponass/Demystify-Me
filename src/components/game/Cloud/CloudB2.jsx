import React, { useState, useEffect, useCallback, useRef } from 'react';
import { gsap } from 'gsap';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import useCloudZoom from '@hooks/useCloudZoom';
import useBlowDetection from '@hooks/useBlowDetection';
import useHintDisplay from '@hooks/useHintDisplay';
import useGameStore from '@store/gameStore';
import useHintStore from '@store/hintStore';
import { getRandomCloudImages } from '@data/cloudDefinitions';
import styles from './Cloud.module.css';
import Layer3Text from './Layer3Text';
import { 
  CLOUD_ANIMATION_DURATION, 
  TRANSITION_SETTLE_TIME, 
  MICROPHONE_START_DELAY 
} from './constants/cloudConstants';
import { createLayer3Timeline, createFeedbackWiggle, startBlowDetectionWithErrorHandling } from './utils/cloudAnimations';

gsap.registerPlugin(MorphSVGPlugin);

const CloudB2 = ({ levelId, cloudId, position, content, onReveal, containerRef }) => {
  const { getCloudState, advanceCloudLayer, getBlowThreshold } = useGameStore();
  const incrementIncorrectBlow = useHintStore(state => state.incrementIncorrectBlow);
  const cloudState = getCloudState(levelId, cloudId);

  const [lightCloudImage] = useState(() => getRandomCloudImages(1, 'Light')[0]);
  const [heavyCloudImage] = useState(() => getRandomCloudImages(1, 'Heavy')[0]);
  const [isReverseDirection] = useState(() => Math.random() > 0.5);
  const [animationDuration] = useState(() => 8 + Math.random() * 6);
  const [isExitAnimating, setIsExitAnimating] = useState(false);

  const { cloudRef, isZoomed, isZoomingOut, handleZoomIn, handleZoomOut } = useCloudZoom(cloudState?.isRevealed, cloudId);

  // Use hint display system but exclude B2 from showing hints
  useHintDisplay(levelId, cloudId, isZoomed, cloudState?.isRevealed);

  // Refs for managing visual elements
  const lightCloudRef = useRef(null);
  const heavyCloudRef = useRef(null);
  const svgPathRef = useRef(null);
  const layer3TextRef = useRef(null);

  const isTransitioning = useRef(false);
  const currentLayerRef = useRef(cloudState?.currentLayer);

  useEffect(() => {
    currentLayerRef.current = cloudState?.currentLayer;
  }, [cloudState?.currentLayer]);

  // SVG morphing function
  const morphSVGText = useCallback(() => {
    if (!svgPathRef.current || !content.svgMorph) return;

    const { targetPath, morphOptions } = content.svgMorph;

    return gsap.to(svgPathRef.current, {
      morphSVG: {
        shape: targetPath,
        map: morphOptions?.map || "position"
      },
      duration: morphOptions?.duration || 1.2,
      ease: "power2.out"
    });
  }, [content.svgMorph]);

  const handleLayer1Blow = useCallback(() => {
    if (!isZoomed || isZoomingOut || isTransitioning.current || currentLayerRef.current !== 1) {
      return;
    }

    // Disable CSS floating animation before GSAP takes over
    setIsExitAnimating(true);
    
    isTransitioning.current = true;

    // Coordinated animation: Light cloud disappears + SVG morphs
    const timeline = gsap.timeline({
      onComplete: () => {
        advanceCloudLayer(levelId, cloudId);
        setTimeout(() => {
          isTransitioning.current = false;
        }, TRANSITION_SETTLE_TIME);
      }
    });

    // Light cloud disappears
    if (lightCloudRef.current) {
      lightCloudRef.current.style.transition = 'none';
      timeline.to(lightCloudRef.current, {
        opacity: 0,
        scale: 1.4,
        duration: CLOUD_ANIMATION_DURATION,
        ease: "sine.out"
      }, 0);
    }

    // SVG morphs simultaneously
    const morphAnimation = morphSVGText();
    if (morphAnimation) {
      timeline.add(morphAnimation, 0.2);
    }

  }, [isZoomed, isZoomingOut, advanceCloudLayer, levelId, cloudId, morphSVGText]);

  const handleLayer2LongBlow = useCallback(() => {
    if (!isZoomed || isZoomingOut || isTransitioning.current || currentLayerRef.current !== 2) {
      return;
    }

    // Disable CSS floating animation before GSAP takes over
    setIsExitAnimating(true);
    
    isTransitioning.current = true;

    const timeline = createLayer3Timeline(
      layer3TextRef.current,
      () => {
        advanceCloudLayer(levelId, cloudId);
        onReveal?.(cloudId);
        setTimeout(() => {
          isTransitioning.current = false;
        }, TRANSITION_SETTLE_TIME);
      }
    );

    const elements = [heavyCloudRef, svgPathRef];
    elements.forEach(element => {
      if (element.current) {
        gsap.killTweensOf(element.current);
        element.current.style.transition = 'none';
        timeline.to(element.current, {
          y: -300,
          opacity: 0,
          scale: 0.8,
          duration: CLOUD_ANIMATION_DURATION,
          ease: 'sine.out'
        }, 0);
      }
    });
  }, [isZoomed, isZoomingOut, advanceCloudLayer, levelId, cloudId, onReveal]);

  const handleLayer2Feedback = useCallback(() => {
    if (currentLayerRef.current !== 2 || isTransitioning.current) {
      return;
    }

    // Increment incorrect blow count for hint system
    if (cloudState?.cloudType) {
      incrementIncorrectBlow(levelId, cloudId, cloudState.cloudType);
    }

    createFeedbackWiggle(heavyCloudRef, 'medium');
  }, [cloudState?.cloudType, incrementIncorrectBlow, levelId, cloudId]);

  const { startListening, stopListening } = useBlowDetection({
    onAnyBlow: () => {
      if (currentLayerRef.current === 1) {
        handleLayer1Blow();
      } else if (currentLayerRef.current === 2) {
        handleLayer2Feedback();
      }
    },
    onLongBlow: () => {
      if (currentLayerRef.current === 1) {
        handleLayer1Blow();
      } else if (currentLayerRef.current === 2) {
        handleLayer2LongBlow();
      }
    },
    onDoubleBlow: handleLayer2Feedback,
    onXLBlow: handleLayer2Feedback,
    blowThreshold: getBlowThreshold(),
  });

  // Initialize SVG and Layer 1 overlay
  useEffect(() => {
    if (cloudState?.currentLayer === 1 && isZoomed && !isTransitioning.current && content.svgMorph) {
      // Set initial SVG path
      if (svgPathRef.current) {
        gsap.set(svgPathRef.current, { attr: { d: content.svgMorph.sourcePath } });
      }

      // Show heavy cloud and SVG
      if (heavyCloudRef.current) {
        gsap.set(heavyCloudRef.current, { opacity: 1 });
      }
    }
  }, [cloudState?.currentLayer, isZoomed, content.svgMorph]);

  // Microphone lifecycle
  const micTimeoutRef = useRef(null);

  useEffect(() => {
    // Clear any pending timeout first
    if (micTimeoutRef.current) {
      clearTimeout(micTimeoutRef.current);
      micTimeoutRef.current = null;
    }

    const shouldListen = isZoomed && !cloudState?.isRevealed;

    if (shouldListen) {
      micTimeoutRef.current = setTimeout(() => {
        startBlowDetectionWithErrorHandling(startListening);
        micTimeoutRef.current = null;
      }, MICROPHONE_START_DELAY);
    } else {
      stopListening();
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
  const isLayer2 = cloudState.currentLayer === 2;
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

        {/* Layer 2 Base: Heavy cloud (always present for Layers 1 & 2) */}
        {(isLayer1 || isLayer2) && (
          <div className={styles.cloudImage}>
            <img
              ref={heavyCloudRef}
              src={heavyCloudImage}
              className={`${styles.floatingCloud} ${!cloudState?.isRevealed && !isExitAnimating
                ? (isReverseDirection ? styles.floatingReverse : styles.floating)
                : ''
                }`}
              style={{
                '--floating-duration': `${animationDuration}s`
              }}
            />
          </div>
        )}

        {/* SVG morphing text layer */}
        {(isLayer1 || isLayer2) && isZoomed && !isZoomingOut && content.svgMorph && (
          <div className={styles.textContent}>
            <svg
              className={styles.morphingSVG}
              viewBox={content.svgMorph.viewBox}
              fill="currentColor"
            >
              <path
                ref={svgPathRef}
                d={content.svgMorph.sourcePath}
                stroke="currentColor"
                strokeWidth="0.2mm"
              />
            </svg>

          </div>
        )}

        {/* Layer 1 Overlay: Semi-transparent Light cloud */}
        {isLayer1 && isZoomed && !isZoomingOut && (
          <div className={`${styles.cloudImage} ${styles.overlayCloud}`}>
            <img
              ref={lightCloudRef}
              src={lightCloudImage}
              className={`${styles.floatingCloud} 
              ${!cloudState?.isRevealed && !isExitAnimating
                ? (isReverseDirection ? styles.floatingReverse : styles.floating)
                : ''
                }`}
              style={{
                '--floating-duration': `${animationDuration}s`
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CloudB2;