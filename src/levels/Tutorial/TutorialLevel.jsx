import React from 'react';
import useLevelProgress from '@hooks/useLevelProgress';

const TutorialLevel = ({ levelId }) => {
  const { isCompleted } = useLevelProgress(levelId, []);
  
  return (
    <div>
      <h1>Tutorial Level</h1>
      <p>Status: {isCompleted ? 'Completed' : 'In Progress'}</p>
      <p>This is the tutorial level where we'll explain how to blow into the microphone.</p>

      <h1>Mystify Me</h1>
      <h2>Motherfuhrer</h2>
      <h3>Where me gulliver at</h3>
      <h4>Jesus H Cristo</h4>
      <h5>Who am I?</h5>
      <h6>I am needed</h6>
      <p>I am Alpha & Omerta.</p>
      <span>I span around the hole.</span>
    </div>
  );
};

export default TutorialLevel;