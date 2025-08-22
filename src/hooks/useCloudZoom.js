import { useState, useCallback, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import useGameStore from '@store/gameStore';

gsap.registerPlugin(Flip);

const useCloudZoomFlip = (isRevealed = false, cloudId = null) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [isZoomingOut, setIsZoomingOut] = useState(false);
  const [canZoomOut, setCanZoomOut] = useState(true);
  const cloudRef = useRef(null);
  const zoomOutDelayRef = useRef(null);
  const originalStylesRef = useRef(null);

  const setZoomState = useGameStore(state => state.setZoomState);
  const globalIsZoomed = useGameStore(state => state.isZoomed);


  const handleZoomIn = useCallback(() => {
    if (isZoomed) return;

    document.body.classList.add('cloud-zoomed');

    const cloudElement = cloudRef.current;
    if (!cloudElement) return;

    // Store original styles for restoration
    originalStylesRef.current = {
      position: cloudElement.style.position || '',
      top: cloudElement.style.top || '',
      left: cloudElement.style.left || '',
      width: cloudElement.style.width || '',
      height: cloudElement.style.height || '',
      transform: cloudElement.style.transform || '',
      zIndex: cloudElement.style.zIndex || ''
    };

    const state = Flip.getState(cloudElement);

    // Calculate safe dimensions based on viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const isMobile = viewportWidth < 768;

    let targetWidth, targetHeight;
    
    if (isMobile) {
      targetWidth = Math.min(
        viewportWidth * 0.92,  // 92% of viewport width
        500                     // Max 500px wide
      );
    } else {
      targetWidth = Math.min(
        viewportWidth * 0.6,   // 60% of viewport width
        768                    // Max 768px wide
      );
    }
    
    targetHeight = targetWidth * 0.6;
    
    // Ensure it fits vertically
    const maxHeightAllowed = viewportHeight * 0.7;
    if (targetHeight > maxHeightAllowed) {
      targetHeight = maxHeightAllowed;
      targetWidth = targetHeight / 0.6;
    }

    // Apply final state with constraints
    gsap.set(cloudElement, {
      position: 'fixed',
      top: '50%',
      left: '50%',
      xPercent: -50,
      yPercent: -50,
      width: `${targetWidth}px`,
      height: `${targetHeight}px`,
      zIndex: 2001,
      overflow: 'visible'
    });

    cloudElement.classList.add('zoomed');
    setIsZoomed(true);
    setZoomState(true, cloudId);

    Flip.from(state, {
      duration: 0.8,
      ease: "sine.inOut",
      absolute: true,
      scale: true,
    });


  }, [isZoomed, setZoomState, cloudId]);

  const handleZoomOut = useCallback(() => {
    if (!isZoomed) return;

    document.body.classList.remove('cloud-zoomed');

    const cloudElement = cloudRef.current;
    if (!cloudElement) return;

    setIsZoomingOut(true);

    // Record current zoomed state
    const state = Flip.getState(cloudElement);

    // Restore original positioning
    gsap.set(cloudElement, {
      clearProps: 'all' // Clear all inline styles
    });

    // Restore any original inline styles that were important
    if (originalStylesRef.current) {
      Object.entries(originalStylesRef.current).forEach(([prop, value]) => {
        if (value) {
          cloudElement.style[prop] = value;
        }
      });
    }

    cloudElement.classList.remove('zoomed');
    
    if (isRevealed) {
      cloudElement.classList.add('revealed');
    }

    // Animate back from zoomed state to original
    Flip.from(state, {
      duration: 0.8,
      ease: "sine.inOut",
      absolute: true,
      scale: false,
      onComplete: () => {
        setIsZoomed(false);
        setIsZoomingOut(false);
        setZoomState(false);
        originalStylesRef.current = null;
      }
    });


  }, [isZoomed, isRevealed, setZoomState]);

  const handleScreenTap = useCallback(() => {
    if (!isZoomed || !isRevealed || !canZoomOut) return;
    handleZoomOut();
  }, [isZoomed, isRevealed, canZoomOut, handleZoomOut]);

  useEffect(() => {
    if (isZoomed && isRevealed) {
      document.addEventListener('click', handleScreenTap);
      return () => document.removeEventListener('click', handleScreenTap);
    }
  }, [isZoomed, isRevealed, handleScreenTap]);

  // Add delay before allowing zoom out after cloud is revealed
  useEffect(() => {
    if (isRevealed && isZoomed) {
      setCanZoomOut(false);
      
      if (zoomOutDelayRef.current) {
        clearTimeout(zoomOutDelayRef.current);
      }
      
      zoomOutDelayRef.current = setTimeout(() => {
        setCanZoomOut(true);
        zoomOutDelayRef.current = null;
      }, 1200);
    } else {
      setCanZoomOut(true);
      if (zoomOutDelayRef.current) {
        clearTimeout(zoomOutDelayRef.current);
        zoomOutDelayRef.current = null;
      }
    }
    
    return () => {
      if (zoomOutDelayRef.current) {
        clearTimeout(zoomOutDelayRef.current);
        zoomOutDelayRef.current = null;
      }
    };
  }, [isRevealed, isZoomed]);

  // Sync with global zoom state changes (e.g., when reset externally)
  useEffect(() => {
    if (!globalIsZoomed && isZoomed) {
      // Global state was reset, clean up local state and DOM
      document.body.classList.remove('cloud-zoomed');
      setIsZoomed(false);
      setIsZoomingOut(false);
    }
  }, [globalIsZoomed, isZoomed]);

  // Cleanup on unmount - only cleanup if this component was responsible for the zoom state
  useEffect(() => {
    return () => {
      if (zoomOutDelayRef.current) {
        clearTimeout(zoomOutDelayRef.current);
        zoomOutDelayRef.current = null;
      }
      // Only cleanup if this component's zoom state matches global state
      if (isZoomed && globalIsZoomed) {
        document.body.classList.remove('cloud-zoomed');
        setZoomState(false);
      }
    };
  }, [isZoomed, globalIsZoomed, setZoomState]);

  return {
    cloudRef,
    isZoomed,
    isZoomingOut,
    handleZoomIn,
    handleZoomOut
  };
};

export default useCloudZoomFlip;