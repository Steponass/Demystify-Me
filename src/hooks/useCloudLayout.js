// src/hooks/useCloudLayout.js - Remove randomness, calculate once
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

const useCloudLayout = (cloudIds = []) => {
  const [cloudPositions, setCloudPositions] = useState({});
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const hasCalculated = useRef(false); // Prevent recalculation

  const hasValidDimensions = useMemo(() => {
    return containerDimensions.width > 200 && containerDimensions.height > 200;
  }, [containerDimensions.width, containerDimensions.height]);

  // Grid-based positioning - NO randomness, calculate once only
  const calculateGridPositions = useCallback(() => {
    if (!hasValidDimensions || cloudIds.length === 0) return;
    if (hasCalculated.current) return; // IMPORTANT: Only calculate once

    const cloudSize = 200;
    const margin = 40;
    const cellSize = cloudSize + margin;

    const cols = Math.floor(containerDimensions.width / cellSize);
    const rows = Math.ceil(cloudIds.length / cols);

    const totalGridWidth = cols * cellSize - margin;
    const totalGridHeight = rows * cellSize - margin;
    const startX = (containerDimensions.width - totalGridWidth) / 2;
    const startY = (containerDimensions.height - totalGridHeight) / 2;

    const newPositions = {};
    
    cloudIds.forEach((cloudId, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      
      // NO randomness - fixed grid positions
      newPositions[cloudId] = {
        x: startX + col * cellSize,
        y: startY + row * cellSize
      };
    });

    setCloudPositions(newPositions);
    hasCalculated.current = true; // Mark as calculated
    console.log('Grid positions calculated once:', newPositions);
  }, [cloudIds, hasValidDimensions, containerDimensions]);

  const updateContainerDimensions = useCallback((width, height) => {
    setContainerDimensions(prev => {
      // Only update if significantly different to prevent micro-adjustments
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
    calculateGridPositions();
  }, [calculateGridPositions]);

  return {
    cloudPositions,
    updateContainerDimensions,
    recalculatePositions: calculateGridPositions
  };
};

export default useCloudLayout;