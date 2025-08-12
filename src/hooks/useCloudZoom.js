// src/hooks/useCloudZoom.js
import { useState, useCallback, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(Flip);

const useCloudZoom = () => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [isZoomingOut, setIsZoomingOut] = useState(false);
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
      backgroundColor: 'hsla(203, 91%, 29%, 0.98)',
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
      maxWidth: '720px',
      height: 'auto',
      maxHeight: 'calc(720px * 9 / 16)',
      aspectRatio: '16 / 9',
      zIndex: 1001,
      padding: '4px',
      visibility: 'visible',
      overflow: 'hidden'
    });

    // Add class for styling
    cloudElement.classList.add('zoomed');

    setIsZoomed(true);

    Flip.from(state, {
      duration: 0.6,
      ease: "power2.inOut",
      scale: true
    });
  }, [isZoomed]);

  const handleZoomOut = useCallback(() => {
    if (!isZoomed) return;

    const cloudElement = cloudRef.current;
    if (!cloudElement) return;

    // Set zooming out state immediately 
    setIsZoomingOut(true);

    // Calculate final position relative to viewport
    const targetRect = originalParent.current.getBoundingClientRect();

    // Remove overlay with animation
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

    // Animate directly with GSAP for more predictable results
    gsap.to(cloudElement, {
      duration: 0.6,
      ease: "power2.inOut",
      width: '200px',  // Use the original cloud size from Cloud.module.css
      height: '120px', // Use the original cloud size from Cloud.module.css
      top: targetRect.top,
      left: targetRect.left,
      xPercent: 0,
      yPercent: 0,
      onComplete: () => {
        // After animation is complete, move the element back to its original DOM position
        if (originalNextSibling.current) {
          originalParent.current.insertBefore(cloudElement, originalNextSibling.current);
        } else {
          originalParent.current.appendChild(cloudElement);
        }

        // Reset the element's appearance
        cloudElement.classList.remove('zoomed');
        gsap.set(cloudElement, { clearProps: "all" });
        setIsZoomed(false);
        setIsZoomingOut(false);
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
    isZoomingOut,
    handleZoomIn,
    handleZoomOut
  };
};

export default useCloudZoom;