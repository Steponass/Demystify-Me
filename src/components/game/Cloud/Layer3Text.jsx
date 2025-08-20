import React, { memo } from 'react';
import styles from './Cloud.module.css';

const Layer3Text = ({ 
  layer3TextRef, 
  content, 
  isLayer3, 
  isZoomed,
  isZoomingOut,
  className = styles.textContent 
}) => {
  return (
    <div 
      ref={layer3TextRef} 
      className={`${className} ${isLayer3 ? styles.visible : ''}`}
      style={{ 
        opacity: isLayer3 ? 1 : 0,
        visibility: isLayer3 ? 'visible' : 'hidden',
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '100%',
        textAlign: 'center',
        pointerEvents: isZoomed ? 'auto' : 'none'
      }}
    >
      <p className={`${styles.finalLayerText} ${(isZoomed && !isZoomingOut) ? styles.zoomedText : styles.unzoomedText}`}>
        {content}
      </p>
    </div>
  );
};

export default memo(Layer3Text);