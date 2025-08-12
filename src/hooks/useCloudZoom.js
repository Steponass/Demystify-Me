// src/hooks/useCloudZoom.js
import { useState, useCallback, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(Flip);

const useCloudZoom = (isRevealed = false) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [isZoomingOut, setIsZoomingOut] = useState(false);
  const cloudRef = useRef(null);
  const overlayRef = useRef(null);

  const handleZoomIn = useCallback(() => {
    if (isZoomed) return;

    const cloudElement = cloudRef.current;
    if (!cloudElement) return;

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
      backgroundColor: 'hsla(203, 91%, 29%, 0.98)',
      zIndex: 1000,
      opacity: 0
    });

    // Position cloud on top of itself (scaled to fit original position)
    Flip.fit(cloudElement, cloudElement, { scale: true });

    // Record the current state
    const state = Flip.getState(cloudElement);

    // Set final zoomed state
    gsap.set(cloudElement, { clearProps: true });
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

    // Animate from original state to zoomed state
    Flip.from(state, {
      duration: 0.8,
      ease: "sine.inOut",
      scale: true,
      absolute: true,
      onComplete: () => gsap.set(cloudElement, { overflow: "visible" })
    });

    // Fade in overlay
    gsap.to(overlay, { opacity: 1, duration: 0.6, ease: "power2.inOut" });

  }, [isZoomed]);

  const handleZoomOut = useCallback(() => {
    if (!isZoomed) return;

    const cloudElement = cloudRef.current;
    if (!cloudElement) return;

    setIsZoomingOut(true);
    gsap.set(cloudElement, { overflow: "hidden" });

    // Record current zoomed state
    const state = Flip.getState(cloudElement);

    // Reset to original size and position (Flip will animate back)
    gsap.set(cloudElement, { clearProps: true });

    // Remove overlay
    if (overlayRef.current) {
      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.6,
        ease: "power2.inOut",
        onComplete: () => {
          overlayRef.current?.remove();
          overlayRef.current = null;
        }
      });
    }

    // Animate back to original state
    Flip.from(state, {
      duration: 0.6,
      ease: "power2.inOut",
      scale: true,
      onComplete: () => {
        cloudElement.classList.remove('zoomed');
        setIsZoomed(false);
        setIsZoomingOut(false);
      }
    });

  }, [isZoomed]);

  const handleScreenTap = useCallback(() => {
    if (!isZoomed || !isRevealed) return;
    handleZoomOut();
  }, [isZoomed, isRevealed, handleZoomOut]);
  useEffect(() => {
    if (isZoomed && isRevealed) {
      document.addEventListener('click', handleScreenTap);
      return () => document.removeEventListener('click', handleScreenTap);
    }
  }, [isZoomed, isRevealed, handleScreenTap]);

  return {
    cloudRef,
    isZoomed,
    isZoomingOut,
    handleZoomIn,
    handleZoomOut
  };
};

export default useCloudZoom;