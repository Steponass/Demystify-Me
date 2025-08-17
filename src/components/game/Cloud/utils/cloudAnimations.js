import { gsap } from 'gsap';
import { 
  ANIMATION_DURATION, 
  LAYER3_FADE_DURATION, 
  CLOUD_FLOAT_Y_DISTANCE, 
  HORIZONTAL_DISTANCE,
  CLOUD_SCALE_FACTOR 
} from '../constants/cloudConstants';

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
        ease: 'sine.in',
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
      gsap.killTweensOf(element.current);
      element.current.style.transition = 'none';

      tl.to(
        element.current,
        {
          y: CLOUD_FLOAT_Y_DISTANCE,
          x: horizontalDistance,
          opacity: 0,
          scale: CLOUD_SCALE_FACTOR,
          duration: ANIMATION_DURATION,
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
    light: { x: [-15, 15, 0], rotation: [0, 0, 0], duration: [0.1, 0.1, 0.1] },
    medium: { x: [-30, 30, 0], rotation: [-2, 2, 0], duration: [0.2, 0.2, 0.2] },
    heavy: { x: [-40, 40, -20, 0], rotation: [-5, 5, -2, 0], duration: [0.2, 0.25, 0.2, 0.25] }
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

export const startBlowDetectionWithErrorHandling = async (startListening) => {
  try {
    const success = await startListening();
    if (!success) {
      console.error('Failed to activate blow detection');
    }
    return success;
  } catch (error) {
    console.error('Error starting blow detection:', error);
    return false;
  }
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
    y: 20,
    scale: 0.9
  });

  // Create staggered entrance animation
  const timeline = gsap.timeline();
  
  timeline.to(validElements, {
    opacity: 1,
    y: 0,
    scale: 1,
    duration: 0.5,
    ease: 'back.out(1.7)',
    stagger: 0.2,
    clearProps: 'transform'
  });

  return timeline;
};