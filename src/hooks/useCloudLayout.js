import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

const useCloudLayout = (cloudIds = []) => {
  const [cloudPositions, setCloudPositions] = useState({});
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const hasCalculated = useRef(false);

  const hasValidDimensions = useMemo(() => {
    return containerDimensions.width > 200 && containerDimensions.height > 300;
  }, [containerDimensions.width, containerDimensions.height]);

  // Calculate responsive cloud dimensions based on viewport
  const cloudDimensions = useMemo(() => {
    const isMobile = containerDimensions.width < 768;
    const isVerySmall = containerDimensions.width < 480;

    // Match CSS custom property behavior
    const mobileSize = 150;
    const desktopSize = 300;
    const vwFactor = containerDimensions.width * 0.15; // 15vw

    const responsiveWidth = Math.max(
      mobileSize,
      Math.min(vwFactor, desktopSize)
    );

    const responsiveHeight = responsiveWidth * 0.6; // Match CSS aspect ratio

    // Dynamic margin based on screen size and available space
    const baseMargin = isVerySmall ? 15 : isMobile ? 25 : 35;
    const spacingFactor = Math.min(containerDimensions.width, containerDimensions.height) / 1000;
    const dynamicMargin = Math.max(baseMargin, baseMargin * spacingFactor);

    return {
      width: Math.floor(responsiveWidth),
      height: Math.floor(responsiveHeight),
      margin: Math.floor(dynamicMargin)
    };
  }, [containerDimensions.width, containerDimensions.height]);

  const checkOverlap = (rect1, rect2) => {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  };

  // Mobile grid positioning
  const calculateMobileGridPositions = useCallback(() => {
    const { width: cloudWidth, height: cloudHeight, margin } = cloudDimensions;
    const isMobile = containerDimensions.width < 768;

    if (!isMobile) return null;

    const cellWidth = cloudWidth + margin;
    const cellHeight = cloudHeight + margin;
    const cols = Math.floor(containerDimensions.width / cellWidth);
    const rows = Math.floor(containerDimensions.height / cellHeight);

    // Center the grid in the container
    const totalGridWidth = cols * cellWidth - margin;
    const totalGridHeight = rows * cellHeight - margin;
    const offsetX = (containerDimensions.width - totalGridWidth) / 2;
    const offsetY = (containerDimensions.height - totalGridHeight) / 2;

    const gridPositions = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        gridPositions.push({
          x: offsetX + col * cellWidth,
          y: offsetY + row * cellHeight
        });
      }
    }

    // Shuffle for variety while maintaining grid structure
    const shuffledPositions = [...gridPositions].sort(() => Math.random() - 0.5);

    const newPositions = {};
    cloudIds.forEach((cloudId, index) => {
      newPositions[cloudId] = shuffledPositions[index];
    });

    return newPositions;
  }, [cloudIds, cloudDimensions, containerDimensions]);


  const calculateRandomPositions = useCallback(() => {
    if (!hasValidDimensions || cloudIds.length === 0) return;
    if (hasCalculated.current) return;

    const { width: cloudWidth, height: cloudHeight, margin } = cloudDimensions;
    const isMobile = containerDimensions.width < 768;

    // Try mobile grid positioning first
    if (isMobile) {
      const mobilePositions = calculateMobileGridPositions();
      if (mobilePositions) {
        setCloudPositions(mobilePositions);
        hasCalculated.current = true;
        console.log('Mobile grid positions calculated:', mobilePositions);
        return;
      }
    }

    // Desktop random positioning or mobile fallback
    const maxAttempts = isMobile ? 75 : 150; // More attempts with full viewport
    const placedClouds = [];
    const newPositions = {};

    // Add safe zones (avoid edges)
    const safeZone = isMobile ? 10 : 20;
    const maxX = containerDimensions.width - cloudWidth - safeZone;
    const maxY = containerDimensions.height - cloudHeight - safeZone;

    for (const cloudId of cloudIds) {
      let positionFound = false;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const candidatePos = {
          x: safeZone + Math.random() * (maxX - safeZone),
          y: safeZone + Math.random() * (maxY - safeZone),
        };

        const candidateRect = {
          ...candidatePos,
          width: cloudWidth + margin,
          height: cloudHeight + margin,
        };

        let isOverlapping = false;
        for (const placedCloud of placedClouds) {
          if (checkOverlap(candidateRect, placedCloud)) {
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
        newPositions[cloudId] = calculateFallbackPosition(cloudId, newPositions, cloudWidth, cloudHeight);
      }
    }

    setCloudPositions(newPositions);
    hasCalculated.current = true;
    console.log('Random positions calculated:', newPositions);
  }, [cloudIds, hasValidDimensions, containerDimensions, cloudDimensions, calculateMobileGridPositions]);

  const calculateFallbackPosition = useCallback((cloudId, existingPositions, cloudWidth, cloudHeight) => {
    // Try corners, center, and edges as fallback
    const safeZone = 10;
    const fallbackPositions = [
      { x: safeZone, y: safeZone }, // Top-left
      { x: containerDimensions.width - cloudWidth - safeZone, y: safeZone }, // Top-right
      { x: safeZone, y: containerDimensions.height - cloudHeight - safeZone }, // Bottom-left
      { x: containerDimensions.width - cloudWidth - safeZone, y: containerDimensions.height - cloudHeight - safeZone }, // Bottom-right
      { x: (containerDimensions.width - cloudWidth) / 2, y: (containerDimensions.height - cloudHeight) / 2 } // Center
    ];

    const usedPositions = Object.values(existingPositions);

    for (const position of fallbackPositions) {
      const isPositionFree = !usedPositions.some(usedPos =>
        Math.abs(usedPos.x - position.x) < cloudWidth * 0.8 &&
        Math.abs(usedPos.y - position.y) < cloudHeight * 0.8
      );

      if (isPositionFree) {
        return position;
      }
    }

    // Last resort: random position
    return {
      x: safeZone + Math.random() * (containerDimensions.width - cloudWidth - safeZone * 2),
      y: safeZone + Math.random() * (containerDimensions.height - cloudHeight - safeZone * 2)
    };
  }, [containerDimensions]);

  const updateContainerDimensions = useCallback((width, height) => {
    setContainerDimensions(previousDimensions => {
      const widthDiff = Math.abs(previousDimensions.width - width);
      const heightDiff = Math.abs(previousDimensions.height - height);

      const threshold = width < 768 ? 5 : 15; // More sensitive on mobile

      if (widthDiff > threshold || heightDiff > threshold) {
        hasCalculated.current = false;
        return { width, height };
      }
      return previousDimensions;
    });
  }, []);

  useEffect(() => {
    calculateRandomPositions();
  }, [calculateRandomPositions]);

  return {
    cloudPositions,
    updateContainerDimensions,
    cloudDimensions,
    recalculatePositions: () => {
      hasCalculated.current = false;
      calculateRandomPositions();
    }
  };
};

export default useCloudLayout;