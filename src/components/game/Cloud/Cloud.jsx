import React from 'react';
import CloudA1 from './CloudA1';
import CloudA2 from './CloudA2';
import CloudA3 from './CloudA3';
import CloudB1 from './CloudB1';
import CloudB2 from './CloudB2';

const Cloud = ({ 
  cloudId, 
  position, 
  cloudType,
  content,
  onReveal,
  levelId,
  containerRef
}) => {
  // Route to appropriate cloud component based on type
  const CloudComponent = {
    'A1': CloudA1,
    'A2': CloudA2,
    'A3': CloudA3,
    'B1': CloudB1,
    'B2': CloudB2
  }[cloudType];

  if (!CloudComponent) {
    console.error(`Unknown cloud type: ${cloudType}`);
    return null;
  }

  return (
    <CloudComponent
      cloudId={cloudId}
      position={position}
      content={content}
      onReveal={onReveal}
      levelId={levelId}
      containerRef={containerRef}
    />
  );
};

export default Cloud;