// src/hooks/useCloudAnimation.js
import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';

const useCloudAnimation = (isRevealed = false, cloudId = '') => {
  const animationRef = useRef(null);
  const timelineRef = useRef(null);

  useEffect(() => {
    const element = animationRef.current;
    if (!element) return;

    // Kill existing animation first
    if (timelineRef.current) {
      timelineRef.current.kill();
    }

    // Only animate if not revealed
    if (!isRevealed) {
      // MUCH slower, very gentle animation
      const amplitude = { x: 5, y: 3 }; // Very small movement - just 5px max
      const duration = 40; // Very slow - 40 seconds for full cycle
      const startDelay = Math.random() * 5; // Random start delay up to 5 seconds

      // Create very gentle figure-8 animation
      timelineRef.current = gsap.timeline({ 
        repeat: -1,
        ease: "none" // Remove easing for smoother, more predictable movement
      });
      
      timelineRef.current
        .to(element, {
          duration: duration / 4,
          x: amplitude.x,
          y: amplitude.y,
          ease: "sine.inOut",
          delay: startDelay
        })
        .to(element, {
          duration: duration / 4,
          x: -amplitude.x,
          y: amplitude.y,
          ease: "sine.inOut"
        })
        .to(element, {
          duration: duration / 4,
          x: -amplitude.x,
          y: -amplitude.y,
          ease: "sine.inOut"
        })
        .to(element, {
          duration: duration / 4,
          x: amplitude.x,
          y: -amplitude.y,
          ease: "sine.inOut"
        });
    } else {
      // Stop animation and reset position if revealed
      gsap.set(element, { x: 0, y: 0 });
    }

    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
    };
  }, [isRevealed, cloudId]);

  return {
    animationRef
  };
};

export default useCloudAnimation;