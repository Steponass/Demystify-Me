export const setLevelGradient = (levelId) => {
  const htmlElement = document.documentElement;

  if (levelId === null || levelId === undefined) {
    // Remove data-level attribute for default gradient
    htmlElement.removeAttribute('data-level');
    return;
  }

  // Convert to string and set the data attribute
  const levelString = String(levelId);
  htmlElement.setAttribute('data-level', levelString);
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