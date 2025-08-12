// Available cloud images per folder
const AVAILABLE_CLOUD_IMAGES = {
  Regular: [
    'Cloud_Reg_1.webp',
    'Cloud_Reg_1_flipped.webp',
    'Cloud_Reg_2.webp',
    'Cloud_Reg_2_flipped.webp',
    'Cloud_Reg_3.webp',
    'Cloud_Reg_3_flipped.webp',
    'Cloud_Reg_4.webp',
    'Cloud_Reg_4_flipped.webp',
    'Cloud_Reg_5.webp',
    'Cloud_Reg_5_flipped.webp',
    'Cloud_Reg_6.webp',
    'Cloud_Reg_6_flipped.webp',
    'Cloud_Reg_7.webp',
    'Cloud_Reg_7_flipped.webp',
    'Cloud_Reg_8.webp',
    'Cloud_Reg_8_flipped.webp',
    'Cloud_Reg_9.webp',
    'Cloud_Reg_10.webp',
    'Cloud_Reg_10_flipped.webp',
    'Cloud_Reg_11.webp',
    'Cloud_Reg_11_flipped.webp'
  ],
  Heavy: [
    'Cloud_Heavy_1.webp',
    'Cloud_Heavy_1_flipped.webp',
    'Cloud_Heavy_2.webp',
    'Cloud_Heavy_2_flipped.webp',
    'Cloud_Heavy_3.webp',
    'Cloud_Heavy_3_flipped.webp',
    'Cloud_Heavy_4.webp',
    'Cloud_Heavy_4_flipped.webp'
  ],
  Light: [
    'Cloud_Light_1.webp',
    'Cloud_Light_1_flipped.webp',
    'Cloud_Light_2.webp',
    'Cloud_Light_2_flipped.webp',
    'Cloud_Light_3.webp',
    'Cloud_Light_3_flipped.webp',
    'Cloud_Light_4.webp',
    'Cloud_Light_5.webp',
    'Cloud_Light_5_flipped.webp',
    'Cloud_Light_6.webp',
    'Cloud_Light_6_flipped.webp',
    'Cloud_Light_7.webp',
    'Cloud_Light_8.webp'
  ]
};

/**
 * Randomly assigns unique cloud images to cloudIds
 * @param {string[]} cloudIds - Array of cloud IDs needing images
 * @param {string} folderType - 'Regular', 'Heavy', or 'Light'
 * @returns {Object} - Mapping of cloudId to image filename
 */
export const assignCloudImages = (cloudIds, folderType = 'Regular') => {
  const availableImages = [...AVAILABLE_CLOUD_IMAGES[folderType]];

  if (cloudIds.length > availableImages.length) {
    console.warn(`Not enough ${folderType} cloud images for ${cloudIds.length} clouds`);
  }

  const assignments = {};

  cloudIds.forEach(cloudId => {
    // Random selection
    const randomIndex = Math.floor(Math.random() * availableImages.length);
    const selectedImage = availableImages[randomIndex];

    // Remove from available pool to prevent duplicates
    availableImages.splice(randomIndex, 1);

    assignments[cloudId] = selectedImage;
  });

  return assignments;
};

/**
 * Gets the full path for a cloud image
 * @param {string} filename - Image filename
 * @param {string} folderType - 'Regular', 'Heavy', or 'Light' 
 * @returns {string} - Full path to image
 */
export const getCloudImagePath = (filename, folderType = 'Regular') => {
  return `/images/clouds/${folderType}/${filename}`;
};

/**
 * Assigns images for all layer types to a set of clouds
 * @param {string[]} cloudIds - Array of cloud IDs
 * @returns {Object} - Nested mapping by layer type
 */
export const assignLayerImages = (cloudIds) => {
  return {
    Regular: assignCloudImages(cloudIds, 'Regular'),
    Heavy: assignCloudImages(cloudIds, 'Heavy'),
    Light: assignCloudImages(cloudIds, 'Light')
  };
};