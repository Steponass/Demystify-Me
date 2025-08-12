// src/hooks/useCloudZoom.js - Based on CodePen approach
import { useState, useCallback, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(Flip);

const useCloudZoom = (cloudId) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const cloudRef = useRef(null);
  const originalParent = useRef(null);
  const originalNextSibling = useRef(null);
  const overlayRef = useRef(null);

  const handleZoomIn = useCallback(() => {
    if (isZoomed) return;

    const cloudElement = cloudRef.current;
    if (!cloudElement) return;

    // Create and animate the overlay
    const overlay = document.createElement('div');
    overlayRef.current = overlay;
    document.body.appendChild(overlay);
    gsap.set(overlay, {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      zIndex: 1000,
      opacity: 0
    });
    gsap.to(overlay, { opacity: 1, duration: 0.6, ease: "power2.inOut" });

    originalParent.current = cloudElement.parentNode;
    originalNextSibling.current = cloudElement.nextSibling;

    document.body.appendChild(cloudElement);

    Flip.fit(cloudElement, originalParent.current, { scale: true });

    const state = Flip.getState(cloudElement);

    gsap.set(cloudElement, { clearProps: true });
    gsap.set(cloudElement, {
      position: 'fixed',
      top: '50%',
      left: '50%',
      xPercent: -50,
      yPercent: -50,
      width: '100%',
      // maxWidth: '720px',
      height: 'auto',
      maxHeight: 'calc(720px * 9 / 16)', // Ensures 16:9 aspect ratio
      aspectRatio: '16 / 9', // CSS property for modern browsers
      zIndex: 1001,
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
      visibility: 'visible',
      overflowY: 'auto'
    });

    // Add class for styling
    cloudElement.classList.add('zoomed');

    setIsZoomed(true);

    Flip.from(state, {
      duration: 0.6,
      ease: "power2.inOut",
      scale: true,
      onComplete: () => {
        console.log(`Zoom in animation complete for cloud ${cloudId}`);
      }
    });
  }, [isZoomed, cloudId]);

  const handleZoomOut = useCallback(() => {
    if (!isZoomed) return;

    const cloudElement = cloudRef.current;
    if (!cloudElement) return;

    // Remove zoomed class first
    cloudElement.classList.remove('zoomed');

    // Capture state BEFORE any changes
    const state = Flip.getState(cloudElement, { props: "all" });

    // Move element back to original position in DOM
    if (originalNextSibling.current) {
      originalParent.current.insertBefore(cloudElement, originalNextSibling.current);
    } else {
      originalParent.current.appendChild(cloudElement);
    }

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

    // Run FLIP animation
    Flip.from(state, {
      duration: 0.6,
      ease: "power2.inOut",
      absolute: true,
      onComplete: () => {
        // Clear all inline styles only after animation completes
        gsap.set(cloudElement, { clearProps: "all" });
        setIsZoomed(false);
      }
    });
  }, [isZoomed]);

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