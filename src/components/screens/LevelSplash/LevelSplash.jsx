import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import styles from './LevelSplash.module.css';

const LevelSplash = ({
  levelId,
  levelTitle,
  isVisible,
  onFadeComplete,
  fadeType = 'in' // 'in', 'out', or 'through'
}) => {
  const overlayRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    if (!overlayRef.current) return;

    // Create a timeline for animations
    const tl = gsap.timeline({
      paused: true,
      onComplete: () => {
        if (fadeType === 'out' || fadeType === 'through') {
          onFadeComplete?.();
        }
      }
    });

    // Reset initial state
    gsap.set(overlayRef.current, { opacity: 0, display: 'none' });
    gsap.set(contentRef.current.children, { y: 30, opacity: 0 });

    if (!isVisible) return;

    gsap.set(overlayRef.current, { display: 'flex' });

    if (fadeType === 'in' || fadeType === 'through') {
      // Fade in overlay
      tl.to(overlayRef.current, {
        opacity: 1,
        duration: 0.4,
        ease: 'power2.out'
      });

      tl.to(contentRef.current.children, {
        y: 0,
        opacity: 1,
        duration: 0.4,
        stagger: 0.2,
        ease: 'back.out(1.2)'
      }, '-=0.2');

      if (fadeType === 'in') {
        tl.call(() => onFadeComplete?.());
      }
    }

    // For 'through' or 'out', add the fade out animations
    if (fadeType === 'out' || fadeType === 'through') {
      // For 'through', add a pause
      if (fadeType === 'through') {
        tl.to({}, { duration: 1.5 }); // pause for 1.5 seconds
      }

      // Fade out content first
      tl.to(contentRef.current.children, {
        y: -20,
        opacity: 0,
        duration: 0.4,
        stagger: 0.1,
        ease: 'power2.in'
      });

      // Then fade out overlay
      tl.to(overlayRef.current, {
        opacity: 0,
        duration: 0.4,
        ease: 'power2.in'
      }, '-=0.1');

      tl.set(overlayRef.current, { display: 'none' });
    }

    tl.play();

    // Cleanup
    return () => {
      tl.kill();
    };
  }, [isVisible, fadeType, onFadeComplete]);

  return (
    <div ref={overlayRef} className={styles.splashOverlay}>
      <div ref={contentRef} className={styles.splashContent}>
        <div className={styles.levelNumber}>
          Level {levelId}
        </div>
        <div className={styles.levelTitle}>
          {levelTitle}
        </div>
      </div>
    </div>
  );
};

export default LevelSplash;
