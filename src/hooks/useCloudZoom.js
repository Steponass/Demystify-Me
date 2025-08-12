// src/hooks/useCloudZoom.js - Simplified for debugging
import { useState, useCallback, useRef, useEffect } from 'react';

const useCloudZoom = (cloudId) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const cloudRef = useRef(null);

  const handleZoomIn = useCallback(() => {
    if (isZoomed) return;

    const cloudElement = cloudRef.current;
    if (!cloudElement) {
      console.error('Cloud element not found for zoom');
      return;
    }

    console.log(`Zooming in cloud ${cloudId}`);
    console.log('Element before zoom:', cloudElement.className);
    
    // Skip Flip for now - just apply the class directly
    cloudElement.classList.add('zoomed');
    setIsZoomed(true);
    
    console.log('Element after zoom:', cloudElement.className);
    console.log('Element computed styles:', window.getComputedStyle(cloudElement));
  }, [isZoomed, cloudId]);

  const handleZoomOut = useCallback(() => {
    if (!isZoomed) return;

    const cloudElement = cloudRef.current;
    if (!cloudElement) return;
    
    console.log(`Zooming out cloud ${cloudId}`);
    
    cloudElement.classList.remove('zoomed');
    setIsZoomed(false);
  }, [isZoomed, cloudId]);

  const handleScreenTap = useCallback((e) => {
    if (!isZoomed) return;
    
    if (!cloudRef.current?.contains(e.target)) {
      handleZoomOut();
    }
  }, [isZoomed, handleZoomOut]);

  useEffect(() => {
    if (isZoomed) {
      document.addEventListener('click', handleScreenTap);
      return () => document.removeEventListener('click', handleScreenTap);
    }
  }, [isZoomed, handleScreenTap]);

  return {
    cloudRef,
    isZoomed,
    handleZoomIn,
    handleZoomOut
  };
};

export default useCloudZoom;