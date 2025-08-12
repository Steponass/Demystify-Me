import React, { useState, useEffect, useCallback } from 'react';
import useCloudZoom from '@hooks/useCloudZoom';
import useCloudAnimation from '@hooks/useCloudAnimation';
import useBlowDetection from '@hooks/useBlowDetection';
import useGameStore from '@store/gameStore';
import { getRandomCloudImages } from '@data/cloudDefinitions';
import styles from './Cloud.module.css';

const CloudA1 = ({ levelId, cloudId, position, content, onReveal, onZoomChange }) => {
  const { getCloudState, advanceCloudLayer } = useGameStore();
  const cloudState = getCloudState(levelId, cloudId);

  // Simple image selection - one image per cloud
  const [cloudImage] = useState(() => getRandomCloudImages(1, 'Regular')[0]);

  const { cloudRef, isZoomed, isZoomingOut, handleZoomIn } = useCloudZoom();
  const { animationRef } = useCloudAnimation(cloudState?.isRevealed, cloudId);

  const handleAnyBlow = useCallback(() => {
    if (!isZoomed || cloudState?.isRevealed || isZoomingOut) return;

    advanceCloudLayer(levelId, cloudId);
    onReveal?.(cloudId);
  }, [isZoomed, isZoomingOut, cloudState?.isRevealed, advanceCloudLayer, levelId, cloudId, onReveal]);

  const { startListening, stopListening } = useBlowDetection({
    onAnyBlow: handleAnyBlow,
  });

  useEffect(() => {
    if (isZoomed) {
      startListening();
      onZoomChange?.(true);
    } else {
      stopListening();
      onZoomChange?.(false);
    }
  }, [isZoomed, startListening, stopListening, onZoomChange]);

  if (!cloudState) return null;

  const getCurrentContent = () => {
    return cloudState.currentLayer === 1 ? content.layer1 : content.layer3;
  };

  const showCloudImage = cloudState.currentLayer === 1;

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
        {/* Cloud image - show on layer 1 (both zoomed and not zoomed) */}
        {showCloudImage && (
          <div className={styles.cloudImage}>
            <img
              ref={animationRef}
              src={cloudImage}
              alt="Cloud"
              className={styles.floatingCloud}
            />
          </div>
        )}

        {/* Text content - only when zoomed and not zooming out */}
        {isZoomed && !isZoomingOut && (
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