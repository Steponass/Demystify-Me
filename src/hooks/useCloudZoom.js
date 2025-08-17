import { useState, useCallback, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import useGameStore from '@store/gameStore';

gsap.registerPlugin(Flip);

const useCloudZoomFlip = (isRevealed = false) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [isZoomingOut, setIsZoomingOut] = useState(false);
  const [canZoomOut, setCanZoomOut] = useState(true);
  const cloudRef = useRef(null);
  const overlayRef = useRef(null);
  const zoomOutDelayRef = useRef(null);
  const originalStylesRef = useRef(null);

  const { setZoomState } = useGameStore();

  // Helper function to get current level background
  const getCurrentLevelBackgroundStyle = () => {
    const levelAttr = document.documentElement.getAttribute('data-level');
    if (levelAttr === 'menu') {
      return 'var(--menu-gradient)';
    }
    return `var(--sunset-gradient-${levelAttr || '1'})`;
  };

  const handleZoomIn = useCallback(() => {
    if (isZoomed) return;

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

    // Create overlay
    const overlay = document.createElement('div');
    overlayRef.current = overlay;
    document.body.appendChild(overlay);
    gsap.set(overlay, {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: getCurrentLevelBackgroundStyle(),
      zIndex: 2000,
      opacity: 0
    });

    // Record current state for Flip
    const state = Flip.getState(cloudElement);

    // Calculate safe dimensions based on viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const isMobile = viewportWidth < 768;

    // Calculate maximum safe dimensions maintaining aspect ratio
    let targetWidth, targetHeight;
    
    if (isMobile) {
      // Mobile: More conservative sizing
      targetWidth = Math.min(
        viewportWidth * 0.85,  // 85% of viewport width
        400                     // Max 400px wide
      );
    } else {
      // Desktop: Larger but still constrained
      targetWidth = Math.min(
        viewportWidth * 0.6,   // 60% of viewport width
        600                    // Max 600px wide
      );
    }
    
    // Calculate height maintaining 0.6 aspect ratio
    targetHeight = targetWidth * 0.6;
    
    // Ensure it fits vertically too
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
    setZoomState(true);

    // Animate from original state to new state
    Flip.from(state, {
      duration: 0.8,
      ease: "sine.inOut",
      absolute: true,
      scale: true,
      onUpdate: function() {
        // Safety check: ensure element stays within viewport
        const rect = cloudElement.getBoundingClientRect();
        const margin = 20; // Safety margin from edges
        
        if (rect.left < margin || 
            rect.right > viewportWidth - margin || 
            rect.top < margin || 
            rect.bottom > viewportHeight - margin) {
          // Force completion if we're going out of bounds
          this.progress(1);
        }
      }
    });

    // Fade in overlay
    gsap.to(overlay, { 
      opacity: 0.98, 
      delay: 0.8, 
      duration: 0.3, 
      ease: "sine.inOut" 
    });

  }, [isZoomed, setZoomState]);

  const handleZoomOut = useCallback(() => {
    if (!isZoomed) return;

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
    
    // If revealed, add revealed class
    if (isRevealed) {
      cloudElement.classList.add('revealed');
    }

    // Animate back from zoomed state to original
    Flip.from(state, {
      duration: 0.6,
      ease: "sine.inOut",
      absolute: true,
      scale: true,
      onComplete: () => {
        setIsZoomed(false);
        setIsZoomingOut(false);
        setZoomState(false);
        originalStylesRef.current = null;
      }
    });

    // Remove overlay
    if (overlayRef.current) {
      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.4,
        ease: "sine.inOut",
        onComplete: () => {
          overlayRef.current?.remove();
          overlayRef.current = null;
        }
      });
    }

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
      }, 1500);
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (overlayRef.current) {
        gsap.killTweensOf(overlayRef.current);
        overlayRef.current.remove();
        overlayRef.current = null;
      }
      if (zoomOutDelayRef.current) {
        clearTimeout(zoomOutDelayRef.current);
        zoomOutDelayRef.current = null;
      }
      if (isZoomed) {
        setZoomState(false);
      }
    };
  }, []);

  return {
    cloudRef,
    isZoomed,
    isZoomingOut,
    handleZoomIn,
    handleZoomOut
  };
};

export default useCloudZoomFlip;