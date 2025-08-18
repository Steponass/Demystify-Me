export const setLevelGradient = (levelId) => {
  const htmlElement = document.documentElement;

  if (levelId === null || levelId === undefined) {
    // Remove data-level attribute for default gradient
    htmlElement.removeAttribute('data-level');
    return;
  }

  // Convert to string and set the data attribute
  const levelString = String(levelId);
  
  // Only update if different to prevent unnecessary transitions
  const currentLevel = htmlElement.getAttribute('data-level');
  if (currentLevel !== levelString) {
    htmlElement.setAttribute('data-level', levelString);
  }
};

export const setMenuGradient = () => {
  setLevelGradient('menu');
};

export const clearLevelGradient = () => {
  setLevelGradient(null);
};

export const getCurrentLevelGradient = () => {
  return document.documentElement.getAttribute('data-level');
};

export const getCurrentLevelBackgroundStyle = () => {
  const currentLevel = getCurrentLevelGradient();
  if (!currentLevel) return 'var(--sunset-gradient-1)'; // Default fallback
  
  if (currentLevel === 'menu') {
    return 'var(--sky-gradient-1)';
  }
  
  return `var(--sunset-gradient-${currentLevel})`;
};