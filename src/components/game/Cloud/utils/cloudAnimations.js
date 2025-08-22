import { gsap } from 'gsap';
import { 
  CLOUD_ANIMATION_DURATION, 
  LAYER3_FADE_DURATION, 
  CLOUD_FLOAT_Y_DISTANCE, 
  HORIZONTAL_DISTANCE,
  CLOUD_SCALE_FACTOR 
} from '@components/game/Cloud/constants/cloudConstants';

export const createLayer3Timeline = (layer3Element, onComplete) => {
  const timeline = gsap.timeline({ onComplete });

  if (layer3Element) {
    gsap.set(layer3Element, {
      opacity: 0,
      display: 'block',
      visibility: 'visible',
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 10,
    });

    timeline.to(
      layer3Element,
      {
        opacity: 1,
        duration: LAYER3_FADE_DURATION,
        ease: 'sine.inOut',
      },
      0
    );
  }

  return timeline;
};

export const animateElementsOut = (elements, timeline = null) => {
  const tl = timeline || gsap.timeline();
  const randomDirection = Math.random() > 0.5 ? 1 : -1;
  const horizontalDistance = HORIZONTAL_DISTANCE * randomDirection;

  elements.forEach(element => {
    if (element?.current) {
      // Kill any existing GSAP tweens but preserve CSS animations momentarily
      gsap.killTweensOf(element.current);
      
      // Get current computed transform to maintain smooth transition
      const computedStyle = getComputedStyle(element.current);
      const currentTransform = computedStyle.transform;
      
      // Parse current transform values to start GSAP from current position
      let currentX = 0, currentY = 0, currentScale = 1;
      if (currentTransform && currentTransform !== 'none') {
        const matrix = currentTransform.match(/matrix.*\((.+)\)/);
        if (matrix) {
          const values = matrix[1].split(', ');
          if (values.length >= 6) {
            currentX = parseFloat(values[4]) || 0;
            currentY = parseFloat(values[5]) || 0;
            currentScale = parseFloat(values[0]) || 1;
          }
        }
      }
      
      // Set initial GSAP values to current computed state
      gsap.set(element.current, {
        x: currentX,
        y: currentY,
        scale: currentScale
      });
      
      // Disable CSS animations
      element.current.style.transition = 'none';
      element.current.style.animation = 'none';

      tl.to(
        element.current,
        {
          y: currentY + CLOUD_FLOAT_Y_DISTANCE,
          x: currentX + horizontalDistance,
          opacity: 0,
          scale: currentScale * CLOUD_SCALE_FACTOR,
          duration: CLOUD_ANIMATION_DURATION,
          ease: 'sine.inOut',
        },
        0
      );
    }
  });

  return tl;
};

export const createFeedbackWiggle = (element, intensity = 'medium') => {
  if (!element?.current) return;

  gsap.killTweensOf(element.current);

  const wiggleParams = {
    medium: { x: [-30, 30, -30, 0], rotation: [-1, 1, 0, 0], duration: [0.1, 0.1, 0.1, 0.1] },
    heavy: { x: [-50, 50, -50, 0], rotation: [-2, 2, -1, 0], duration: [0.14, 0.14, 0.14, 0.14] }
  };

  const params = wiggleParams[intensity] || wiggleParams.medium;
  const timeline = gsap.timeline();

  for (let i = 0; i < params.x.length; i++) {
    timeline.to(element.current, {
      x: params.x[i],
      rotation: params.rotation[i],
      duration: params.duration[i],
      ease: i === params.x.length - 1 ? 'bounce.out' : 'power2.out'
    });
  }

  return timeline;
};

export const createCloudEntranceAnimation = (cloudContainers) => {
  if (!cloudContainers || cloudContainers.length === 0) return null;

  // Filter out null/undefined refs and get valid elements
  const validElements = cloudContainers
    .filter(ref => ref && ref.current)
    .map(ref => ref.current);

  if (validElements.length === 0) return null;

  // Set initial state for all clouds
  gsap.set(validElements, {
    opacity: 0,
    y: 10,
    scale: 0.9
  });

  // Create staggered entrance animation
  const timeline = gsap.timeline();
  
  timeline.to(validElements, {
    opacity: 1,
    y: 0,
    scale: 1,
    duration: 0.5,
    ease: 'sine.inOut',
    stagger: 0.4,
    clearProps: 'transform'
  });

  return timeline;
};