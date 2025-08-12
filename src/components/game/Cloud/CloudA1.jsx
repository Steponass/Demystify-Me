import React, { useEffect, useCallback } from 'react';
import useCloudZoom from '@hooks/useCloudZoom';
import useCloudAnimation from '@hooks/useCloudAnimation';
import useBlowDetection from '@hooks/useBlowDetection';
import useGameStore from '@store/gameStore';
import styles from './Cloud.module.css';

const CloudA1 = ({ levelId = 1, cloudId, position, content, onReveal, onZoomChange }) => {
  const { getCloudState, advanceCloudLayer, getCloudImage } = useGameStore();
  const cloudState = getCloudState(levelId, cloudId);

  const { cloudRef, isZoomed, handleZoomIn } = useCloudZoom(cloudId);
  const { animationRef } = useCloudAnimation(cloudState?.isRevealed, cloudId);

  // Get the assigned cloud image based on current layer
  const getCloudImageForCurrentLayer = () => {
    if (!cloudState) return null;

    // Determine which image folder to use based on layer
    let layerType = 'Regular';
    if (cloudState.currentLayer === 2) {
      layerType = 'Heavy'; // or whatever logic you want for layer 2
    } else if (cloudState.currentLayer === 3) {
      layerType = 'Light'; // or whatever logic you want for layer 3
    }

    return getCloudImage(levelId, cloudId, layerType); // TODO: Get level dynamically
  };

  const cloudImageSrc = getCloudImageForCurrentLayer();

  // Handle blow detection
  const handleAnyBlow = useCallback(() => {
    if (!isZoomed || cloudState?.isRevealed) return;

    advanceCloudLayer(levelId, cloudId); // TODO: Get level dynamically
    onReveal?.(cloudId);
  }, [isZoomed, cloudState?.isRevealed, advanceCloudLayer, cloudId, onReveal]);

  // Initialize blow detection when zoomed
  const { startListening, stopListening } = useBlowDetection({
    onAnyBlow: handleAnyBlow,
  });

  // Start/stop microphone based on zoom state - use useCallback to prevent re-renders
  const handleZoomChange = useCallback(() => {
    if (isZoomed) {
      startListening();
      onZoomChange?.(true);
    } else {
      stopListening();
      onZoomChange?.(false);
    }
  }, [isZoomed, startListening, stopListening, onZoomChange]);

  // Only run when zoom state actually changes
  useEffect(() => {
    handleZoomChange();
  }, [isZoomed]); // Only depend on isZoomed, not the callback

  if (!cloudState) return null;

  const getCurrentContent = () => {
    return cloudState.currentLayer === 1 ? content.layer1 : content.layer3;
  };

  const hasCloudImage = cloudState.currentLayer === 1;

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
        onClick={handleZoomIn}
        data-flip-id={cloudId}
      >
        {/* Cloud image - only visible when not zoomed or if current layer has image */}
        {(!isZoomed || hasCloudImage) && (
          <div className={styles.cloudImage}>
            {cloudImageSrc ? (
              <img
                ref={animationRef}
                src={cloudImageSrc}
                alt="Cloud"
                className={styles.floatingCloud}
              />
            ) : (
              // Fallback if no image assigned
              <div
                ref={animationRef}
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(135deg, #87CEEB, #E0F6FF)',
                  borderRadius: '50px'
                }}
              />
            )}
          </div>
        )}

        {/* Text content - only visible when zoomed */}
        {isZoomed && (
          <div className={styles.textContent}>
            <p className={cloudState.currentLayer === 3 ? styles.finalLayerText : styles.regularLayerText}>
              {getCurrentContent()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CloudA1;