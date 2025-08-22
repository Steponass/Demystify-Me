import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

const useCloudLayout = (cloudIds = []) => {
  const [cloudPositions, setCloudPositions] = useState({});
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const hasCalculated = useRef(false);

  const hasValidDimensions = useMemo(() => {
    return containerDimensions.width > 200 && containerDimensions.height > 300;
  }, [containerDimensions.width, containerDimensions.height]);

  // Responsive cloud sizing with intermediate breakpoint (was problematic)
  const cloudDimensions = useMemo(() => {
    const width = containerDimensions.width;
    
    let cloudWidth;
    if (width < 480) {
      cloudWidth = 120;
    } else if (width < 700) {
      // Scale proportionally in the problematic range
      cloudWidth = 120 + ((width - 480) / (700 - 480)) * (200 - 120);
    } else {
      cloudWidth = 250;
    }
    
    const cloudHeight = cloudWidth * 0.6;
    const margin = width < 480 ? 20 : 30;

    return {
      width: Math.floor(cloudWidth),
      height: Math.floor(cloudHeight),
      margin: Math.floor(margin)
    };
  }, [containerDimensions.width]);

  const checkCollision = useCallback((rect1, rect2) => {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }, []);

  // Fallback with better spacing
  const findFallbackPosition = useCallback((placedRects, cloudWidth, cloudHeight, buffer, safeZone, cloudIndex) => {
    const containerWidth = containerDimensions.width;
    const containerHeight = containerDimensions.height;
    
    // Larger step size for better coverage
    const stepSizeX = Math.max(cloudWidth * 0.75, 100);
    const stepSizeY = Math.max(cloudHeight * 0.75, 80);
    
    const maxX = containerWidth - cloudWidth - safeZone - buffer;
    const maxY = containerHeight - cloudHeight - safeZone - buffer;

    // Try grid positions with better spacing
    for (let y = safeZone; y <= maxY; y += stepSizeY) {
      for (let x = safeZone; x <= maxX; x += stepSizeX) {
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

    // Last resort: distribute clouds more evenly
    const columnsCount = Math.max(2, Math.floor(containerWidth / (cloudWidth + buffer)));
    const rowsCount = Math.max(2, Math.floor(containerHeight / (cloudHeight + buffer)));
    
    const column = cloudIndex % columnsCount;
    const row = Math.floor(cloudIndex / columnsCount) % rowsCount;
    
    return {
      x: safeZone + (column * (containerWidth - cloudWidth - safeZone * 2) / Math.max(1, columnsCount - 1)),
      y: safeZone + (row * (containerHeight - cloudHeight - safeZone * 2) / Math.max(1, rowsCount - 1))
    };
  }, [containerDimensions, checkCollision]);

  const calculatePositions = useCallback(() => {
    if (!hasValidDimensions || cloudIds.length === 0) return;
    if (hasCalculated.current) return;

    const { width: cloudWidth, height: cloudHeight } = cloudDimensions;
    const isMobile = containerDimensions.width < 480;
    
    const newPositions = {};
    const placedRects = [];
    
    const safeZone = 20;
    const buffer = isMobile ? 15 : 25;
    
    const maxX = containerDimensions.width - cloudWidth - safeZone - buffer;
    const maxY = containerDimensions.height - cloudHeight - safeZone - buffer;
    const maxAttempts = 100;

    cloudIds.forEach((cloudId, index) => {
      let positionFound = false;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const candidatePos = {
          x: safeZone + Math.random() * Math.max(0, maxX - safeZone),
          y: safeZone + Math.random() * Math.max(0, maxY - safeZone),
        };

        const candidateRect = {
          x: candidatePos.x - buffer,
          y: candidatePos.y - buffer,
          width: cloudWidth + (buffer * 2),
          height: cloudHeight + (buffer * 2),
        };

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

      if (!positionFound) {
        const fallbackPos = findFallbackPosition(
          placedRects, 
          cloudWidth, 
          cloudHeight, 
          buffer, 
          safeZone, 
          index
        );
        newPositions[cloudId] = fallbackPos;
        
        const fallbackRect = {
          x: fallbackPos.x - buffer,
          y: fallbackPos.y - buffer,
          width: cloudWidth + (buffer * 2),
          height: cloudHeight + (buffer * 2),
        };
        placedRects.push(fallbackRect);
      }
    });

    setCloudPositions(newPositions);
    hasCalculated.current = true;
  }, [cloudIds, hasValidDimensions, containerDimensions, cloudDimensions, checkCollision, findFallbackPosition]);

  const updateContainerDimensions = useCallback((width, height) => {
    setContainerDimensions(previousDimensions => {
      const widthDiff = Math.abs(previousDimensions.width - width);
      const heightDiff = Math.abs(previousDimensions.height - height);

      const threshold = width < 480 ? 5 : 15;

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