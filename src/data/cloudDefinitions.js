export const CLOUD_IMAGES = {
  Regular: [
    '/images/clouds/Regular/Cloud_Reg_1.webp',
    '/images/clouds/Regular/Cloud_Reg_1_flipped.webp',
    '/images/clouds/Regular/Cloud_Reg_2.webp',
    '/images/clouds/Regular/Cloud_Reg_2_flipped.webp',
    '/images/clouds/Regular/Cloud_Reg_3.webp',
    '/images/clouds/Regular/Cloud_Reg_3_flipped.webp',
    '/images/clouds/Regular/Cloud_Reg_4.webp',
    '/images/clouds/Regular/Cloud_Reg_4_flipped.webp',
    '/images/clouds/Regular/Cloud_Reg_5.webp',
    '/images/clouds/Regular/Cloud_Reg_5_flipped.webp',
    '/images/clouds/Regular/Cloud_Reg_6.webp',
    '/images/clouds/Regular/Cloud_Reg_6_flipped.webp',
    '/images/clouds/Regular/Cloud_Reg_7.webp',
    '/images/clouds/Regular/Cloud_Reg_7_flipped.webp',
    '/images/clouds/Regular/Cloud_Reg_8.webp',
    '/images/clouds/Regular/Cloud_Reg_8_flipped.webp',
    '/images/clouds/Regular/Cloud_Reg_9.webp',
    '/images/clouds/Regular/Cloud_Reg_9_flipped.webp',
    '/images/clouds/Regular/Cloud_Reg_10.webp',
    '/images/clouds/Regular/Cloud_Reg_10_flipped.webp',
    '/images/clouds/Regular/Cloud_Reg_11.webp',
    '/images/clouds/Regular/Cloud_Reg_11_flipped.webp'
  ],
  Heavy: [
    '/images/clouds/Heavy/Cloud_Heavy_1.webp',
    '/images/clouds/Heavy/Cloud_Heavy_1_flipped.webp',
    '/images/clouds/Heavy/Cloud_Heavy_2.webp',
    '/images/clouds/Heavy/Cloud_Heavy_2_flipped.webp',
    '/images/clouds/Heavy/Cloud_Heavy_3.webp',
    '/images/clouds/Heavy/Cloud_Heavy_3_flipped.webp',
    '/images/clouds/Heavy/Cloud_Heavy_4.webp',
    '/images/clouds/Heavy/Cloud_Heavy_4_flipped.webp'
  ],
  Light: [
    '/images/clouds/Light/Cloud_Light_1.webp',
    '/images/clouds/Light/Cloud_Light_1_flipped.webp',
    '/images/clouds/Light/Cloud_Light_2.webp',
    '/images/clouds/Light/Cloud_Light_2_flipped.webp',
    '/images/clouds/Light/Cloud_Light_3.webp',
    '/images/clouds/Light/Cloud_Light_3_flipped.webp',
    '/images/clouds/Light/Cloud_Light_4.webp',
    '/images/clouds/Light/Cloud_Light_5.webp',
    '/images/clouds/Light/Cloud_Light_5_flipped.webp',
    '/images/clouds/Light/Cloud_Light_6.webp',
    '/images/clouds/Light/Cloud_Light_6_flipped.webp',
    '/images/clouds/Light/Cloud_Light_7.webp',
    '/images/clouds/Light/Cloud_Light_8.webp',
    '/images/clouds/Light/Cloud_Light_8_flipped.webp'
  ]
};

/**
 * Get random cloud images for a level
 * @param {number} count - How many images needed
 * @param {string} category - 'Regular', 'Heavy', or 'Light'
 * @returns {string[]} - Array of image paths
 */
export const getRandomCloudImages = (count, category = 'Regular') => {
  const availableImages = [...CLOUD_IMAGES[category]];
  const selectedImages = [];

  for (let i = 0; i < count && availableImages.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * availableImages.length);
    const selectedImage = availableImages.splice(randomIndex, 1)[0];
    selectedImages.push(selectedImage);
  }

  return selectedImages;
};