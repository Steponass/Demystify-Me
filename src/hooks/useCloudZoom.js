import { useState, useCallback, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import useGameStore from '@store/gameStore';

gsap.registerPlugin(Flip);

const useCloudZoom = (isRevealed = false) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [isZoomingOut, setIsZoomingOut] = useState(false);
  const [canZoomOut, setCanZoomOut] = useState(true);
  const cloudRef = useRef(null);
  const overlayRef = useRef(null);
  const zoomOutDelayRef = useRef(null);

  const { setZoomState } = useGameStore();

  const handleZoomIn = useCallback(() => {
    if (isZoomed) return;

    const cloudElement = cloudRef.current;
    if (!cloudElement) return;

    const overlay = document.createElement('div');
    overlayRef.current = overlay;
    document.body.appendChild(overlay);
    gsap.set(overlay, {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'hsla(203, 91%, 29%, 0.98)',
      zIndex: 100,
      opacity: 0
    });

    // Record the current state
    const state = Flip.getState(cloudElement);

    // Set final zoomed state
    gsap.set(cloudElement, {
      position: 'fixed',
      top: '50%',
      left: '50%',
      xPercent: -50,
      yPercent: -50,
      width: '100%',
      maxWidth: '720px',
      height: 'auto',
      maxHeight: 'calc(720px * 9 / 16)',
      aspectRatio: '16 / 9',
      zIndex: 1001,
      visibility: 'visible',
      overflow: 'visible'
    });

    cloudElement.classList.add('zoomed');
    setIsZoomed(true);
    setZoomState(true);

    // Animate from original state to zoomed state
    Flip.from(state, {
      duration: 0.8,
      ease: "sine.inOut",
      scale: true,
      absolute: true,
      onComplete: () => gsap.set(cloudElement, { overflow: "visible" })
    });

    // Fade in overlay
    gsap.to(overlay, { opacity: 1, duration: 0.4, ease: "sine.inOut" });

  }, [isZoomed, setZoomState]);

  const handleZoomOut = useCallback(() => {
    if (!isZoomed) return;

    const cloudElement = cloudRef.current;
    if (!cloudElement) return;

    setIsZoomingOut(true);

    gsap.killTweensOf(cloudElement);

    // Simple fade out and scale down in zoomed position
    gsap.to(cloudElement, {
      opacity: 0,
      scale: 0,
      duration: 0.6,
      ease: "sine.inOut",
      onComplete: () => {
        // Reset to original position and styling
        gsap.set(cloudElement, { clearProps: true });
        cloudElement.classList.remove('zoomed');
        
        // If revealed, add the revealed class to show Layer 3
        if (isRevealed) {
          cloudElement.classList.add('revealed');
        }

        // Fade in and scale up in original grid position
        gsap.fromTo(cloudElement, 
          { opacity: 0, scale: 0.3 },
          { 
            opacity: 1, 
            scale: 1,
            delay: 0.2,
            duration: 0.6,
            ease: "sine.inOut",
            onComplete: () => {
              setIsZoomed(false);
              setIsZoomingOut(false);
              setZoomState(false);
            }
          }
        );
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

  // Add delay before allowing zoom out after cloud is revealed (after blow)
  useEffect(() => {
    if (isRevealed && isZoomed) {
      // Disable zoom out immediately when revealed
      setCanZoomOut(false);
      
      // Clear any existing timeout
      if (zoomOutDelayRef.current) {
        clearTimeout(zoomOutDelayRef.current);
      }
      
      // Enable zoom out after 1.5 seconds to allow audio context to close
      zoomOutDelayRef.current = setTimeout(() => {
        setCanZoomOut(true);
        zoomOutDelayRef.current = null;
      }, 1500);
    } else {
      // Reset canZoomOut when not in revealed+zoomed state
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

  useEffect(() => {
    return () => {
      // Only cleanup if component unmounts while still zoomed
      // This handles the case where user navigates away via menu button
      if (overlayRef.current) {
        gsap.killTweensOf(overlayRef.current);
        overlayRef.current.remove();
        overlayRef.current = null;
      }
      // Clear zoom out delay timeout
      if (zoomOutDelayRef.current) {
        clearTimeout(zoomOutDelayRef.current);
        zoomOutDelayRef.current = null;
      }
      // Reset zoom state in store if unmounting while zoomed
      if (isZoomed) {
        setZoomState(false);
      }
    };
  }, []); // Empty dependency array - only runs on unmount

  return {
    cloudRef,
    isZoomed,
    isZoomingOut,
    handleZoomIn,
    handleZoomOut
  };
};

export default useCloudZoom;