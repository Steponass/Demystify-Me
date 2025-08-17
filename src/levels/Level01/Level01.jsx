import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import Cloud from '@components/game/Cloud/Cloud';
import useLevelProgress from '@hooks/useLevelProgress';
import useCloudLayout from '@hooks/useCloudLayout';
import levelData from '@data/levels/level-01.json';
import styles from '@levels/Level.module.css';
import { createCloudEntranceAnimation } from '@components/game/Cloud/utils/cloudAnimations';

const Level01 = ({ levelId }) => {
  const containerRef = useRef(null);

  const cloudConfigs = useMemo(() => 
    levelData.clouds.map(cloud => ({
      cloudId: cloud.cloudId,
      cloudType: cloud.cloudType
    })), []);

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

  // Trigger entrance animation when clouds are positioned
  useEffect(() => {
    const allCloudsPositioned = cloudConfigs.every(config => cloudPositions[config.cloudId]);
    
    if (allCloudsPositioned && Object.keys(cloudPositions).length > 0) {
      // Small delay to ensure DOM elements are rendered
      const timer = setTimeout(() => {
        const cloudContainerRefs = Object.values(cloudRefs);
        createCloudEntranceAnimation(cloudContainerRefs);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [cloudPositions, cloudConfigs, cloudRefs]);

  const handleCloudReveal = useCallback((cloudId) => {
    console.log(`Cloud ${cloudId} revealed!`);
  }, []);

  return (
    <main>
      <div className={styles.cloud_layout}
        ref={containerRef}
      >
        {levelData.clouds.map((cloudData) => {
          const position = cloudPositions[cloudData.cloudId];

          // Don't render until we have position data
          if (!position) return null;

          return (
            <Cloud
              key={cloudData.cloudId}
              cloudId={cloudData.cloudId}
              cloudType={cloudData.cloudType}
              position={position}
              content={cloudData.content}
              onReveal={handleCloudReveal}
              levelId={levelId}
              containerRef={cloudRefs[cloudData.cloudId]}
            />
          );
        })}
      </div>
    </main>
  );
};

export default Level01;