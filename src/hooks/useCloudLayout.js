// src/hooks/useCloudLayout.js - Place clouds in random, non-overlapping positions
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

const useCloudLayout = (cloudIds = []) => {
  const [cloudPositions, setCloudPositions] = useState({});
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const hasCalculated = useRef(false);

  const hasValidDimensions = useMemo(() => {
    return containerDimensions.width > 200 && containerDimensions.height > 200;
  }, [containerDimensions.width, containerDimensions.height]);

  // Helper function to check for overlap between two rectangles
  const checkOverlap = (rect1, rect2) => {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  };

  // Random positioning with collision detection
  const calculateRandomPositions = useCallback(() => {
    if (!hasValidDimensions || cloudIds.length === 0) return;
    if (hasCalculated.current) return;

    const cloudWidth = 200;
    const cloudHeight = 120;
    const margin = 40; // Space between clouds
    const maxAttempts = 100; // Prevent infinite loops

    const placedClouds = [];
    const newPositions = {};

    for (const cloudId of cloudIds) {
      let positionFound = false;
      for (let i = 0; i < maxAttempts; i++) {
        const candidatePos = {
          x: Math.random() * (containerDimensions.width - cloudWidth),
          y: Math.random() * (containerDimensions.height - cloudHeight),
        };

        const candidateRect = {
          ...candidatePos,
          width: cloudWidth + margin,
          height: cloudHeight + margin,
        };

        let isOverlapping = false;
        for (const placed of placedClouds) {
          if (checkOverlap(candidateRect, placed)) {
            isOverlapping = true;
            break;
          }
        }

        if (!isOverlapping) {
          newPositions[cloudId] = candidatePos;
          placedClouds.push(candidateRect);
          positionFound = true;
          break;
        }
      }

      if (!positionFound) {
        console.warn(`Could not find a non-overlapping position for cloud ${cloudId} after ${maxAttempts} attempts.`);
        // Fallback: place it randomly anyway
        newPositions[cloudId] = {
          x: Math.random() * (containerDimensions.width - cloudWidth),
          y: Math.random() * (containerDimensions.height - cloudHeight),
        };
      }
    }

    setCloudPositions(newPositions);
    hasCalculated.current = true;
    console.log('Random positions calculated:', newPositions);
  }, [cloudIds, hasValidDimensions, containerDimensions]);

  const updateContainerDimensions = useCallback((width, height) => {
    setContainerDimensions(prev => {
      const widthDiff = Math.abs(prev.width - width);
      const heightDiff = Math.abs(prev.height - height);

      if (widthDiff > 10 || heightDiff > 10) {
        hasCalculated.current = false; // Allow recalculation on significant resize
        return { width, height };
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    calculateRandomPositions();
  }, [calculateRandomPositions]);

  return {
    cloudPositions,
    updateContainerDimensions,
    recalculatePositions: () => {
      hasCalculated.current = false;
      calculateRandomPositions();
    }
  };
};

export default useCloudLayout;