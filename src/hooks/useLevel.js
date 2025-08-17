import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { gsap } from 'gsap';
import useLevelProgress from '@hooks/useLevelProgress';
import useCloudLayout from '@hooks/useCloudLayout';
import { createCloudEntranceAnimation } from '@components/game/Cloud/utils/cloudAnimations';

const useLevel = (levelId, levelData, customHandleReveal = null) => {
  const containerRef = useRef(null);

  const cloudConfigs = useMemo(() => 
    levelData.clouds.map(cloud => ({
      cloudId: cloud.cloudId,
      cloudType: cloud.cloudType
    })), [levelData.clouds]);

  const cloudIds = useMemo(() => 
    cloudConfigs.map(config => config.cloudId), [cloudConfigs]);

  // Create refs for each cloud container
  const cloudRefs = useMemo(() => {
    const refs = {};
    cloudConfigs.forEach(config => {
      refs[config.cloudId] = React.createRef();
    });
    return refs;
  }, [cloudConfigs]);

  useLevelProgress(levelId, cloudConfigs);

  const { cloudPositions, updateContainerDimensions } = useCloudLayout(cloudIds);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        updateContainerDimensions(rect.width, rect.height);
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [updateContainerDimensions]);

  // Set initial hidden state immediately when clouds are positioned
  useEffect(() => {
    const allCloudsPositioned = cloudConfigs.every(config => cloudPositions[config.cloudId]);
    
    if (allCloudsPositioned && Object.keys(cloudPositions).length > 0) {
      const cloudContainerRefs = Object.values(cloudRefs);
      const validElements = cloudContainerRefs
        .filter(ref => ref && ref.current)
        .map(ref => ref.current);

      if (validElements.length > 0) {
        // Immediately set initial hidden state to prevent flash
        gsap.set(validElements, {
          opacity: 0,
          y: 20,
          scale: 0.9
        });

        // Delay to a) ensure DOM elements are fully rendered; b) Animate after level title enters
        const timer = setTimeout(() => {
          createCloudEntranceAnimation(cloudContainerRefs);
        }, 950);
        
        return () => clearTimeout(timer);
      }
    }
  }, [cloudPositions, cloudConfigs, cloudRefs]);

  const handleCloudReveal = useCallback((cloudId) => {
    if (customHandleReveal) {
      customHandleReveal(cloudId);
    } else {
      console.log(`Cloud ${cloudId} revealed!`);
    }
  }, [customHandleReveal]);

  return {
    containerRef,
    cloudRefs,
    cloudPositions,
    handleCloudReveal,
    levelData
  };
};

export default useLevel;