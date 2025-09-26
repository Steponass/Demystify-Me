import { useState, useEffect, useCallback, useRef } from 'react';

const useBlowDetection = ({
  anyBlowMinDuration = 300,
  longBlowThreshold = 700,
  xlBlowThreshold = 1200,
  doubleBlowMaxGap = 1200,
  blowThreshold = 0.28,
  onAnyBlow = () => { },
  onDoubleBlow = () => { },
  onLongBlow = () => { },
  onXLBlow = () => { },
  onLevelChange = () => { },
  onMicrophoneError = () => { },
} = {}) => {

  const [isListening, setIsListening] = useState(false);
  const [microphoneState, setMicrophoneState] = useState('inactive'); // 'inactive', 'requesting', 'active', 'error'

  const onLevelChangeRef = useRef(onLevelChange);
  const onAnyBlowRef = useRef(onAnyBlow);
  const onDoubleBlowRef = useRef(onDoubleBlow);
  const onLongBlowRef = useRef(onLongBlow);
  const onXLBlowRef = useRef(onXLBlow);
  const onMicrophoneErrorRef = useRef(onMicrophoneError);

  // Update callback refs when props change
  useEffect(() => {
    onLevelChangeRef.current = onLevelChange;
    onAnyBlowRef.current = onAnyBlow;
    onDoubleBlowRef.current = onDoubleBlow;
    onLongBlowRef.current = onLongBlow;
    onXLBlowRef.current = onXLBlow;
    onMicrophoneErrorRef.current = onMicrophoneError;
  });

  // Audio processing refs
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneStreamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const dataArrayRef = useRef(null);

  // Blow detection refs
  const isBlowingRef = useRef(false);
  const blowStartTimeRef = useRef(null);
  const lastBlowEndTimeRef = useRef(null);
  const requestStartTimeRef = useRef(null);

  const cleanupAudioResources = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (microphoneStreamRef.current) {
      const microphoneTracks = microphoneStreamRef.current.getTracks();
      microphoneTracks.forEach(track => track.stop());
      microphoneStreamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
      analyserRef.current = null;
    }

    isBlowingRef.current = false;
    blowStartTimeRef.current = null;
    lastBlowEndTimeRef.current = null;

    setIsListening(false);
    setMicrophoneState('inactive');
    onLevelChangeRef.current(0);
  }, []);

  const createDetailedErrorInfo = useCallback((error, requestStartTime) => {
    const requestDuration = requestStartTime ? Date.now() - requestStartTime : 0;
    
    return {
      type: error.name,
      message: error.message,
      isPermissionDenied: error.name === 'NotAllowedError',
      isDeviceNotFound: error.name === 'NotFoundError',
      isBrowserUnsupported: !navigator.mediaDevices?.getUserMedia,
      wasImmediateDenial: requestDuration < 100,
      requestDuration,
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    };
  }, []);

  const requestMicrophoneAccess = useCallback(async () => {
    try {
      setMicrophoneState('requesting');
      requestStartTimeRef.current = Date.now();
      
      // Return early if we already have a stream
      if (microphoneStreamRef.current) {
        setMicrophoneState('active');
        return { success: true, stream: microphoneStreamRef.current };
      }

      // Clean up any existing audio context that might be in a bad state
      if (audioContextRef.current) {
        if (audioContextRef.current.state !== 'closed') {
          await audioContextRef.current.close();
        }
        audioContextRef.current = null;
      }

      // Create a fresh audio context for blow detection
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();

      // Resume context if it's in suspended state
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Request mic access with settings optimized for breath detection
      const microphoneStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });

      microphoneStreamRef.current = microphoneStream;
      setMicrophoneState('active');
      return { success: true, stream: microphoneStream };
      
    } catch (error) {
      console.error('Microphone access request failed:', error);
      setMicrophoneState('error');
      
      // Create detailed error information
      const errorInfo = createDetailedErrorInfo(error, requestStartTimeRef.current);
      
      // Notify parent component about the error
      onMicrophoneErrorRef.current(errorInfo);
      
      return { success: false, error: errorInfo };
    }
  }, [createDetailedErrorInfo]);

  const initializeAudioProcessing = useCallback(async () => {
    try {
      // Ensure there's microphone access
      if (!microphoneStreamRef.current) {
        const accessResult = await requestMicrophoneAccess();
        if (!accessResult.success) {
          return false;
        }
      }

      // Ensure audio context exists and is ready
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      // Resume context if needed (browser security requirement)
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Set up audio analyzer with settings for breath detection
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256; // 128 or 512 weren't as good, so this is golden middle

      const microphoneSourceNode = audioContextRef.current.createMediaStreamSource(microphoneStreamRef.current);
      microphoneSourceNode.connect(analyserRef.current);

      // Create data array for frequency analysis
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);

      return true;
    } catch (error) {
      console.error('Audio processing initialization failed:', error);
      setMicrophoneState('error');
      
      const errorInfo = createDetailedErrorInfo(error);
      onMicrophoneErrorRef.current(errorInfo);
      
      return false;
    }
  }, [requestMicrophoneAccess, createDetailedErrorInfo]);

  const startListening = useCallback(async () => {
    try {
      if (isListening) return { success: true };

      const audioProcessingReady = await initializeAudioProcessing();
      if (!audioProcessingReady) {
        return { success: false, reason: 'audio_processing_failed' };
      }

      const analyzeAudioData = () => {
        try {
          if (!analyserRef.current || !dataArrayRef.current) {
            return;
          }

          analyserRef.current.getByteFrequencyData(dataArrayRef.current);

          const averageAmplitude = dataArrayRef.current.reduce((sum, value) => sum + value, 0) /
            dataArrayRef.current.length / 255; // Normalize to 0-1 range

          // Report current audio level for UI feedback
          onLevelChangeRef.current(averageAmplitude);

          const currentTime = Date.now();

          // BLOW START DETECTION: When amplitude crosses threshold
          if (averageAmplitude > blowThreshold && !isBlowingRef.current) {
            isBlowingRef.current = true;
            blowStartTimeRef.current = currentTime;
          }
          // BLOW END DETECTION: When amplitude drops below threshold with hysteresis
          else if (averageAmplitude <= blowThreshold * 0.8 && isBlowingRef.current) {
            const blowDuration = currentTime - blowStartTimeRef.current;

            // Only process blows longer than minimum duration (filters out noise spikes)
            if (blowDuration >= anyBlowMinDuration) {
              
              // DOUBLE BLOW DETECTION: Measure gap between blows
              if (lastBlowEndTimeRef.current) {
                // Calculate silence gap: from when last blow ended to when current blow started
                const actualGapBetweenBlows = blowStartTimeRef.current - lastBlowEndTimeRef.current;
                
                if (actualGapBetweenBlows <= doubleBlowMaxGap) {
                  onDoubleBlowRef.current();
                }
              }

              // Update the timestamp for when this blow ended (for next gap calculation)
              lastBlowEndTimeRef.current = currentTime;

              onAnyBlowRef.current();

              if (blowDuration >= longBlowThreshold) {
                onLongBlowRef.current();
              }

              if (blowDuration >= xlBlowThreshold) {
                onXLBlowRef.current();
              }
            }

            // Reset blow detection state for next blow
            isBlowingRef.current = false;
            blowStartTimeRef.current = null;
          }

          // Continue analyzing in next animation frame
          if (animationFrameRef.current) {
            animationFrameRef.current = requestAnimationFrame(analyzeAudioData);
          }
        } catch (analysisError) {
          console.error('Audio analysis failed:', analysisError);
          // If analysis fails for any reason, cleanup
          cleanupAudioResources();
        }
      };

      // Start the audio analysis loop
      animationFrameRef.current = requestAnimationFrame(analyzeAudioData);
      setIsListening(true);

      return { success: true };
    } catch (error) {
      console.error('Failed to start listening:', error);
      const errorInfo = createDetailedErrorInfo(error);
      onMicrophoneErrorRef.current(errorInfo);
      
      return { success: false, error: errorInfo };
    }
  }, [
    isListening,
    initializeAudioProcessing,
    blowThreshold,
    anyBlowMinDuration,
    longBlowThreshold,
    xlBlowThreshold,
    doubleBlowMaxGap,
    cleanupAudioResources,
    createDetailedErrorInfo
  ]);

  const stopListening = useCallback(() => {
    cleanupAudioResources();
  }, [cleanupAudioResources]);

  // Check for browser microphone support on mount
  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicrophoneState('error');
      const errorInfo = {
        type: 'NotSupportedError',
        message: 'Browser does not support getUserMedia',
        isBrowserUnsupported: true,
        isPermissionDenied: false,
        isDeviceNotFound: false
      };
      onMicrophoneErrorRef.current(errorInfo);
    }

    return () => {
      cleanupAudioResources();
    };
  }, [cleanupAudioResources]);

  return {
    isListening,
    microphoneState,
    isBlowing: isBlowingRef.current,
    requestMicrophoneAccess,
    startListening,
    stopListening,
    cleanupAudioResources
  };
};

export default useBlowDetection;