// src/components/game/Cloud/CloudA1.jsx
import React, { useEffect, useCallback } from 'react';
import useCloudZoom from '@hooks/useCloudZoom';
import useCloudAnimation from '@hooks/useCloudAnimation';
import useBlowDetection from '@hooks/useBlowDetection';
import useGameStore from '@store/gameStore';
import styles from './Cloud.module.css';

const CloudA1 = ({ cloudId, position, content, onReveal, onZoomChange }) => {
  const { getCloudState, advanceCloudLayer } = useGameStore();
  const cloudState = getCloudState(1, cloudId); // TODO: Get level dynamically
  
  const { cloudRef, isZoomed, handleZoomIn } = useCloudZoom(cloudId);
  const { animationRef } = useCloudAnimation(cloudState?.isRevealed, cloudId);

  // Handle blow detection
  const handleAnyBlow = useCallback(() => {
    if (!isZoomed || cloudState?.isRevealed) return;
    
    advanceCloudLayer(1, cloudId); // TODO: Get level dynamically
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
        className={`${styles.cloud} ${cloudState.isRevealed ? styles.revealed : ''}`}
        onClick={handleZoomIn}
        data-flip-id={cloudId}
      >
        {/* Cloud image - only visible when not zoomed or if current layer has image */}
        {(!isZoomed || hasCloudImage) && (
          <div className={styles.cloudImage}>
            {/* Use public path for Vite, add fallback */}
            <img 
              ref={animationRef}
              src={`/assets/clouds/cloud_reg_${cloudId}.webp`}
              alt="Cloud"
              className={styles.floatingCloud}
              onError={(e) => {
                // Fallback to a solid background if image doesn't exist
                e.target.style.display = 'none';
                e.target.parentElement.style.background = 'linear-gradient(135deg, #87CEEB, #E0F6FF)';
                e.target.parentElement.style.borderRadius = '50px';
              }}
            />
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