// src/hooks/useBlowDetection.js
import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook for detecting different blow patterns using the microphone
 * @param {Object} options - Configuration options
 * @param {number} options.anyBlowMinDuration - Minimum duration for an "any blow" detection (ms)
 * @param {number} options.longBlowThreshold - Duration threshold for "long blow" detection (ms)
 * @param {number} options.xlBlowThreshold - Duration threshold for "XL blow" detection (ms)
 * @param {number} options.doubleBlowMaxGap - Maximum gap between blows for "double blow" detection (ms)
 * @param {number} options.blowThreshold - Audio amplitude threshold to detect a blow
 * @param {Function} options.onAnyBlow - Callback when any blow is detected
 * @param {Function} options.onDoubleBlow - Callback when double blow is detected
 * @param {Function} options.onLongBlow - Callback when long blow is detected
 * @param {Function} options.onXLBlow - Callback when XL blow is detected
 * @param {Function} options.onLevelChange - Callback to report current audio level (0-1)
 * @returns {Object} - Blow detection state and controls
 */
const useBlowDetection = ({
  anyBlowMinDuration = 175,
  longBlowThreshold = 500,
  xlBlowThreshold = 800,
  doubleBlowMaxGap = 650,
  blowThreshold = 0.28,
  onAnyBlow = () => { },
  onDoubleBlow = () => { },
  onLongBlow = () => { },
  onXLBlow = () => { },
  onLevelChange = () => { },
} = {}) => {
  // Permission and microphone state
  const [permissionStatus, setPermissionStatus] = useState('prompt'); // 'prompt', 'granted', 'denied'
  const [isListening, setIsListening] = useState(false);

  // Audio processing references
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneStreamRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Blow detection state
  const isBlowingRef = useRef(false);
  const blowStartTimeRef = useRef(null);
  const lastBlowEndTimeRef = useRef(null);
  const dataArrayRef = useRef(null);

  // Cleanup function for audio resources
  const cleanupAudio = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (microphoneStreamRef.current) {
      const tracks = microphoneStreamRef.current.getTracks();
      tracks.forEach(track => track.stop());
      microphoneStreamRef.current = null;
    }

    // Make sure we don't re-create AudioContext objects unnecessarily
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(error => {
          console.error('Error closing AudioContext:', error);
        });
      }
      audioContextRef.current = null;
      analyserRef.current = null;
    }

    isBlowingRef.current = false;
    blowStartTimeRef.current = null;
    setIsListening(false);

    // Reset level when stopped
    onLevelChange(0);
  }, [onLevelChange]);

  // Request microphone access
  const requestMicrophoneAccess = useCallback(async () => {
    try {
      // Check if we already have a stream
      if (microphoneStreamRef.current) {
        return true;
      }

      // Clean up any existing audio context that might be in a bad state
      if (audioContextRef.current) {
        try {
          if (audioContextRef.current.state !== 'closed') {
            await audioContextRef.current.close();
          }
        } catch (err) {
          console.warn('Error closing existing AudioContext:', err);
        }
        audioContextRef.current = null;
      }

      // Create a fresh audio context
      console.log('Creating new AudioContext');
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();

      // If context is in suspended state (common in some browsers), try to resume it
      if (audioContextRef.current.state === 'suspended') {
        try {
          await audioContextRef.current.resume();
          console.log('AudioContext resumed from suspended state');
        } catch (err) {
          console.warn('Could not resume AudioContext:', err);
        }
      }

      // Request microphone access
      console.log('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });

      microphoneStreamRef.current = stream;
      setPermissionStatus('granted');
      console.log('Microphone access granted');

      return true;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setPermissionStatus(error.name === 'NotAllowedError' ? 'denied' : 'error');
      return false;
    }
  }, []);

  // Initialize audio processing
  const initializeAudioProcessing = useCallback(async () => {
    try {
      if (!microphoneStreamRef.current) {
        const hasAccess = await requestMicrophoneAccess();
        if (!hasAccess) return false;
      }

      // Double check that the audio context exists before proceeding
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      // Ensure the audio context is in the running state
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Set up analyzer
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;

      // Connect microphone to analyzer
      const source = audioContextRef.current.createMediaStreamSource(microphoneStreamRef.current);
      source.connect(analyserRef.current);

      // Create data array for analyzer
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);

      return true;
    } catch (error) {
      console.error('Error initializing audio processing:', error);
      return false;
    }
  }, [requestMicrophoneAccess]);  // Start listening for blows
  const startListening = useCallback(async () => {
    try {
      // Don't restart if already listening
      if (isListening) return true;

      console.log('Starting blow detection');

      const ready = await initializeAudioProcessing();
      if (!ready) {
        console.error('Failed to initialize audio processing');
        return false;
      }

      // Recent amplitude history for smoother detection
      const recentAmplitudes = [];
      const MAX_HISTORY = 3;

      // Start analyzing audio data
      const analyzeAudio = () => {
        try {
          if (!analyserRef.current || !dataArrayRef.current) {
            console.warn('Analyzer or data array is not available');
            return;
          }

          analyserRef.current.getByteFrequencyData(dataArrayRef.current);

          // Calculate average amplitude
          const average = dataArrayRef.current.reduce((sum, value) => sum + value, 0) /
            dataArrayRef.current.length / 255; // Normalize to 0-1

          // Report current level
          onLevelChange(average);

          // Keep track of recent amplitudes for smoother detection
          recentAmplitudes.push(average);
          if (recentAmplitudes.length > MAX_HISTORY) {
            recentAmplitudes.shift();
          }

          // Calculate smoothed average
          const smoothedAverage = recentAmplitudes.reduce((sum, val) => sum + val, 0) / recentAmplitudes.length;

          const now = Date.now();

          // Detect blow start
          if (smoothedAverage > blowThreshold && !isBlowingRef.current) {
            isBlowingRef.current = true;
            blowStartTimeRef.current = now;
            console.log('Blow started, level:', smoothedAverage);
          }
          // Detect blow end
          else if (smoothedAverage <= blowThreshold * 0.8 && isBlowingRef.current) {
            const blowDuration = now - blowStartTimeRef.current;

            // Only process blows longer than minimum duration
            if (blowDuration >= anyBlowMinDuration) {
              console.log('Blow ended, duration:', blowDuration);

              // Call appropriate callbacks based on blow duration
              onAnyBlow();

              if (blowDuration >= xlBlowThreshold) {
                onXLBlow();
              } else if (blowDuration >= longBlowThreshold) {
                onLongBlow();
              }

              // Check for double blow pattern
              if (lastBlowEndTimeRef.current &&
                (now - lastBlowEndTimeRef.current) <= doubleBlowMaxGap) {
                onDoubleBlow();
              }

              lastBlowEndTimeRef.current = now;
            }

            isBlowingRef.current = false;
            blowStartTimeRef.current = null;
          }

          // Continue analyzing in next frame
          if (animationFrameRef.current) {
            animationFrameRef.current = requestAnimationFrame(analyzeAudio);
          }
        } catch (error) {
          console.error('Error in audio analysis loop:', error);
          cleanupAudio();
        }
      };

      // Start the analysis loop
      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
      setIsListening(true);
      console.log('Blow detection started successfully');

      return true;
    } catch (error) {
      console.error('Error starting listening:', error);
      return false;
    }
  }, [
    isListening,
    initializeAudioProcessing,
    blowThreshold,
    anyBlowMinDuration,
    longBlowThreshold,
    xlBlowThreshold,
    doubleBlowMaxGap,
    onAnyBlow,
    onDoubleBlow,
    onLongBlow,
    onXLBlow,
    onLevelChange,
    cleanupAudio
  ]);

  // Stop listening for blows
  const stopListening = useCallback(() => {
    cleanupAudio();
  }, [cleanupAudio]);

  // Cleanup when component unmounts
  useEffect(() => {
    // Check for browser microphone support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPermissionStatus('unsupported');
      return;
    }

    // Check current permission status
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'microphone' })
        .then(result => {
          setPermissionStatus(result.state);

          // Listen for permission changes
          result.onchange = () => {
            setPermissionStatus(result.state);
          };
        })
        .catch(error => {
          console.error('Error querying permission status:', error);
        });
    }

    // Cleanup on unmount
    return () => {
      cleanupAudio();
    };
  }, [cleanupAudio]);

  return {
    // Status
    permissionStatus,
    isListening,
    isBlowing: isBlowingRef.current,

    // Controls
    requestMicrophoneAccess,
    startListening,
    stopListening,
  };
};

export default useBlowDetection;