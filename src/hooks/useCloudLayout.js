import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

const useCloudLayout = (cloudIds = []) => {
  const [cloudPositions, setCloudPositions] = useState({});
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const hasCalculated = useRef(false);

  const hasValidDimensions = useMemo(() => {
    return containerDimensions.width > 200 && containerDimensions.height > 300;
  }, [containerDimensions.width, containerDimensions.height]);

  // Simplified cloud dimensions - only 480px breakpoint
  const cloudDimensions = useMemo(() => {
    const isMobile = containerDimensions.width < 480;
    
    const width = isMobile ? 120 : 250;
    const height = width * 0.6; // Maintain aspect ratio
    const margin = isMobile ? 20 : 30;

    return {
      width: Math.floor(width),
      height: Math.floor(height),
      margin: Math.floor(margin)
    };
  }, [containerDimensions.width]);

  // Proper bounding box collision detection
  const checkCollision = (rect1, rect2) => {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  };

  // Systematic fallback positioning when random placement fails
  const findFallbackPosition = useCallback((placedRects, cloudWidth, cloudHeight, buffer, safeZone) => {
    const stepSize = cloudWidth / 4; // Try positions in quarter-width steps
    const maxX = containerDimensions.width - cloudWidth - safeZone;
    const maxY = containerDimensions.height - cloudHeight - safeZone;

    // Try positions in a grid pattern
    for (let y = safeZone; y <= maxY; y += stepSize) {
      for (let x = safeZone; x <= maxX; x += stepSize) {
        const candidateRect = {
          x: x - buffer,
          y: y - buffer,
          width: cloudWidth + (buffer * 2),
          height: cloudHeight + (buffer * 2),
        };

        const hasCollision = placedRects.some(placedRect => 
          checkCollision(candidateRect, placedRect)
        );

        if (!hasCollision) {
          return { x, y };
        }
      }
    }

    // Last resort: place at a corner with minimal overlap risk
    return {
      x: safeZone + Math.random() * 50,
      y: safeZone + Math.random() * 50
    };
  }, [containerDimensions, checkCollision]);


  const calculatePositions = useCallback(() => {
    if (!hasValidDimensions || cloudIds.length === 0) return;
    if (hasCalculated.current) return;

    const { width: cloudWidth, height: cloudHeight } = cloudDimensions;
    const isMobile = containerDimensions.width < 480;
    
    const newPositions = {};
    const placedRects = [];
    
    // Safe zone to avoid edges
    const safeZone = 20;
    const maxX = containerDimensions.width - cloudWidth - safeZone;
    const maxY = containerDimensions.height - cloudHeight - safeZone;
    
    // Buffer space between clouds to ensure visual separation
    const buffer = isMobile ? 15 : 25;
    const maxAttempts = 100;

    for (const cloudId of cloudIds) {
      let positionFound = false;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const candidatePos = {
          x: safeZone + Math.random() * (maxX - safeZone),
          y: safeZone + Math.random() * (maxY - safeZone),
        };

        // Create bounding rectangle with buffer
        const candidateRect = {
          x: candidatePos.x - buffer,
          y: candidatePos.y - buffer,
          width: cloudWidth + (buffer * 2),
          height: cloudHeight + (buffer * 2),
        };

        // Check for collisions with all placed clouds
        const hasCollision = placedRects.some(placedRect => 
          checkCollision(candidateRect, placedRect)
        );

        if (!hasCollision) {
          newPositions[cloudId] = candidatePos;
          placedRects.push(candidateRect);
          positionFound = true;
          break;
        }
      }

      // Fallback: try systematic placement if random fails
      if (!positionFound) {
        const fallbackPos = findFallbackPosition(placedRects, cloudWidth, cloudHeight, buffer, safeZone);
        newPositions[cloudId] = fallbackPos;
        
        // Add to placed rects
        const fallbackRect = {
          x: fallbackPos.x - buffer,
          y: fallbackPos.y - buffer,
          width: cloudWidth + (buffer * 2),
          height: cloudHeight + (buffer * 2),
        };
        placedRects.push(fallbackRect);
      }
    }

    setCloudPositions(newPositions);
    hasCalculated.current = true;
  }, [cloudIds, hasValidDimensions, containerDimensions, cloudDimensions, checkCollision, findFallbackPosition]);

  const updateContainerDimensions = useCallback((width, height) => {
    setContainerDimensions(previousDimensions => {
      const widthDiff = Math.abs(previousDimensions.width - width);
      const heightDiff = Math.abs(previousDimensions.height - height);

      const threshold = width < 480 ? 5 : 15; // More sensitive on mobile

      if (widthDiff > threshold || heightDiff > threshold) {
        hasCalculated.current = false;
        return { width, height };
      }
      return previousDimensions;
    });
  }, []);

  useEffect(() => {
    calculatePositions();
  }, [calculatePositions]);

  return {
    cloudPositions,
    updateContainerDimensions,
    cloudDimensions,
    recalculatePositions: () => {
      hasCalculated.current = false;
      calculatePositions();
    }
  };
};

export default useCloudLayout;