/**
 * @param {Uint8Array} dataArray - Raw frequency data from analyzer
 * @returns {number} - Normalized amplitude value (0-1)
 */

export const calculateAverageAmplitude = (dataArray) => {
  if (!dataArray || !dataArray.length) return 0;
  
  const sum = dataArray.reduce((acc, val) => acc + val, 0);
  return sum / (dataArray.length * 255); // Normalize to 0-1 scale
};

/**
 * Checks if the browser supports audio input
 * @returns {boolean} - Whether the browser supports microphone access
 */
export const isMicrophoneSupported = () => {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
};

/**
 * Creates a calibration function to adjust blow threshold based on background noise
 * @param {number} sampleDuration - Duration to sample background noise (ms)
 * @param {number} safetyMargin - Multiplier above baseline to set threshold
 * @returns {Promise<number>} - Recommended blow threshold
 */
export const calibrateMicrophoneSensitivity = async (sampleDuration = 2000, safetyMargin = 2.5) => {
  if (!isMicrophoneSupported()) {
    throw new Error('Microphone not supported in this browser');
  }
  
  try {
    // Create audio context and analyzer
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyzer = audioContext.createAnalyser();
    analyzer.fftSize = 256;
    
    // Get microphone stream
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyzer);
    
    // Sample the background noise
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    // Take multiple samples over the duration
    const samples = [];
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const sampleInterval = setInterval(() => {
        analyzer.getByteFrequencyData(dataArray);
        samples.push(calculateAverageAmplitude(dataArray));
        
        if (Date.now() - startTime >= sampleDuration) {
          clearInterval(sampleInterval);
          
          // Clean up
          stream.getTracks().forEach(track => track.stop());
          audioContext.close();
          
          // Calculate average and set threshold
          const averageNoise = samples.reduce((sum, val) => sum + val, 0) / samples.length;
          const recommendedThreshold = Math.min(0.3, Math.max(0.1, averageNoise * safetyMargin));
          
          resolve(recommendedThreshold);
        }
      }, 100); // Sample every 100ms
    });
  } catch (error) {
    console.error('Calibration error:', error);
    // Return a sensible default if calibration fails
    return 0.15;
  }
};