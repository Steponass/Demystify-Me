import React, { useState, useEffect, useCallback, useRef } from "react";
import { gsap } from "gsap";
import useCloudZoom from "@hooks/useCloudZoom";
import useBlowDetection from "@hooks/useBlowDetection";
import useHintDisplay from "@hooks/useHintDisplay";
import { useCloudMicrophone } from "@hooks/useCloudMicrophone";
import useGameStore from "@store/gameStore";
import useHintStore from "@store/hintStore";
import { getRandomCloudImages } from "@data/cloudDefinitions";
import styles from "./Cloud.module.css";
import Layer3Text from "./Layer3Text";
import {
  MICROPHONE_START_DELAY,
  FEEDBACK_TIMEOUT_DELAY,
} from "./constants/cloudConstants";
import {
  createLayer3Timeline,
  animateElementsOut,
} from "./utils/cloudAnimations";

const CloudA2 = ({
  levelId,
  cloudId,
  position,
  content,
  onReveal,
  animationDelay = 0,
  containerRef,
}) => {
  const { getCloudState, advanceCloudLayer, getBlowThreshold } = useGameStore();
  const incrementIncorrectBlow = useHintStore(
    (state) => state.incrementIncorrectBlow
  );
  const resetIncorrectBlowsForCloud = useHintStore(
    (state) => state.resetIncorrectBlowsForCloud
  );
  const cloudState = getCloudState(levelId, cloudId);

  const [regularCloudImage] = useState(
    () => getRandomCloudImages(1, "Regular")[0]
  );
  const [lightCloudImage] = useState(() => getRandomCloudImages(1, "Light")[0]);

  const [isReverseDirection] = useState(() => Math.random() > 0.5);
  const [animationDuration] = useState(() => 8 + Math.random() * 6);
  const [isExitAnimating, setIsExitAnimating] = useState(false);

  const { cloudRef, isZoomed, isZoomingOut, handleZoomIn, handleZoomOut } =
    useCloudZoom(cloudState?.isRevealed, cloudId);

  const prevZoomedStateRef = useRef(isZoomed);

  useEffect(() => {
    if (prevZoomedStateRef.current && !isZoomed) {
      resetIncorrectBlowsForCloud(levelId, cloudId);
      isSuccessfulBlowRef.current = false;
    }
    prevZoomedStateRef.current = isZoomed;
  }, [isZoomed, resetIncorrectBlowsForCloud, levelId, cloudId]);

  useHintDisplay(levelId, cloudId, isZoomed, cloudState?.isRevealed);

  const regularCloudRef = useRef(null);
  const lightCloudRef = useRef(null);
  const textContentRef = useRef(null);
  const layer3TextRef = useRef(null);

  // Track blow attempts to differentiate anyblow from double blow
  const lastBlowTimeRef = useRef(null);
  const feedbackTimeoutRef = useRef(null);
  const isSuccessfulBlowRef = useRef(false);

  const handleDoubleBlow = useCallback(() => {
    if (!isZoomed || cloudState?.isRevealed || isZoomingOut) {
      return;
    }

    // Mark that we got the correct blow to prevent subsequent incorrect feedback
    isSuccessfulBlowRef.current = true;

    // Cancel any pending incorrect blow feedback
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }

    // Hide text immediately when blow is detected
    if (textContentRef.current) {
      textContentRef.current.style.display = "none";
    }

    setIsExitAnimating(true);

    const timeline = createLayer3Timeline(layer3TextRef.current, () => {
      advanceCloudLayer(levelId, cloudId);
      onReveal?.(cloudId);
    });

    animateElementsOut([regularCloudRef, lightCloudRef], timeline);
  }, [
    isZoomed,
    isZoomingOut,
    cloudState?.isRevealed,
    advanceCloudLayer,
    levelId,
    cloudId,
    onReveal,
  ]);

  // Blow tracking: waits to see if it's part of a pattern
  const handleAnyBlowDetected = useCallback(() => {
    if (!isZoomed || cloudState?.isRevealed || isZoomingOut) {
      return;
    }

    if (isSuccessfulBlowRef.current) {
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

      // Increment incorrect blow count for hint system
      if (cloudState?.cloudType) {
        incrementIncorrectBlow(levelId, cloudId, cloudState.cloudType);
      }

      const lightCloudElement = lightCloudRef.current;
      if (!lightCloudElement) return;

      gsap.killTweensOf(lightCloudElement);

      // Temporarily disable CSS animation
      lightCloudElement.style.animation = "none";

      gsap
        .timeline({
          onComplete: () => {
            // Re-enable CSS animation after bounce
            lightCloudElement.style.animation = "";
          },
        })
        .to(lightCloudElement, {
          y: -155,
          duration: 0.15,
          ease: "sine.inOut",
        })
        .to(lightCloudElement, {
          y: 0,
          duration: 0.25,
          ease: "bounce.out",
        });

      feedbackTimeoutRef.current = null;
    }, FEEDBACK_TIMEOUT_DELAY);
  }, [
    isZoomed,
    isZoomingOut,
    cloudState?.isRevealed,
    cloudState?.cloudType,
    incrementIncorrectBlow,
    levelId,
    cloudId,
  ]);

  const { startListening, stopListening } = useBlowDetection({
    onDoubleBlow: handleDoubleBlow,
    onAnyBlow: handleAnyBlowDetected,
    onLongBlow: () => {},
    onXLBlow: () => {},
    blowThreshold: getBlowThreshold(),
  });

  useCloudMicrophone(
    isZoomed,
    cloudState?.isRevealed,
    startListening,
    stopListening
  );

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
      isSuccessfulBlowRef.current = false;
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
        animationDelay: `${animationDelay}s`,
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
          <>
            {/* Top layer: Light cloud (bounces on incorrect blow) */}
            <div className={`${styles.cloudImage} ${styles.overlayCloudA3}`}>
              <img
                ref={lightCloudRef}
                src={lightCloudImage}
                className={`${styles.floatingCloud} 
                ${
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

            {/* Middle layer: Text content (when zoomed) */}
            {isZoomed && !isZoomingOut && (
              <div
                ref={textContentRef}
                className={styles.textContent}
                style={{ zIndex: 6 }}
              >
                <p className={styles.regularLayerText}>{content.layer1}</p>
              </div>
            )}

            {/* Bottom layer: Regular cloud */}
            <div className={styles.cloudImage} style={{ zIndex: 5 }}>
              <img
                ref={regularCloudRef}
                src={regularCloudImage}
                className={`${styles.floatingCloud} 
                ${
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
          </>
        )}
      </div>
    </div>
  );
};

export default CloudA2;
