import React from 'react';
import styles from './Cloud.module.css';

const Layer3Text = ({ 
  layer3TextRef, 
  content, 
  isLayer3, 
  isZoomed,
  className = styles.textContent 
}) => {
  return (
    <div 
      ref={layer3TextRef} 
      className={`${className} ${isLayer3 ? styles.visible : ''}`}
      style={{ 
        opacity: isLayer3 ? 1 : 0,
        visibility: isLayer3 ? 'visible' : 'hidden',
        // zIndex: isZoomed ? 10 : 3,
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '100%',
        textAlign: 'center',
        pointerEvents: isZoomed ? 'auto' : 'none'
      }}
    >
      <p className={styles.finalLayerText}>
        {content}
      </p>
    </div>
  );
};

export default Layer3Text;