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
} = {}) => {

  const [isListening, setIsListening] = useState(false);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneStreamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const dataArrayRef = useRef(null);

  const isBlowingRef = useRef(false);
  const blowStartTimeRef = useRef(null);
  
  // Track when last blow ended to measure gaps for double blow
  const lastBlowEndTimeRef = useRef(null);

  const cleanupAudioResources = useCallback(() => {
    // Cancel any pending animation frames
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
    onLevelChange(0);
  }, [onLevelChange]);

  const requestMicrophoneAccess = useCallback(async () => {
    try {
      // Return early if we already have a stream
      if (microphoneStreamRef.current) {
        return true;
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

      // Resume context if it's in suspended state (common browser behavior)
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
      return true;
    } catch {
      // Return false on any microphone access failure
      return false;
    }
  }, []);


  const initializeAudioProcessing = useCallback(async () => {
    try {
      // Ensure there's microphone access
      if (!microphoneStreamRef.current) {
        const hasMicrophoneAccess = await requestMicrophoneAccess();
        if (!hasMicrophoneAccess) return false;
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
      analyserRef.current.fftSize = 256; // Good balance of frequency resolution and performance. 512 didn't improve anything, at least not on PC

      const microphoneSourceNode = audioContextRef.current.createMediaStreamSource(microphoneStreamRef.current);
      microphoneSourceNode.connect(analyserRef.current);

      // Create data array for frequency analysis
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);

      return true;
    } catch {
      return false;
    }
  }, [requestMicrophoneAccess]);


  const startListening = useCallback(async () => {
    try {
      // Prevent restart if already listening
      if (isListening) return true;

      const audioProcessingReady = await initializeAudioProcessing();
      if (!audioProcessingReady) {
        return false;
      }

      // Start analyzing audio data in real-time
      const analyzeAudioData = () => {
        try {
          if (!analyserRef.current || !dataArrayRef.current) {
            return;
          }

          analyserRef.current.getByteFrequencyData(dataArrayRef.current);

          // Calculate average amplitude
          const averageAmplitude = dataArrayRef.current.reduce((sum, value) => sum + value, 0) /
            dataArrayRef.current.length / 255; // Normalize to 0-1 range

          // Report current audio level for UI feedback
          onLevelChange(averageAmplitude);


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
                  onDoubleBlow();
                }
              }

              // Update the timestamp for when this blow ended (for next gap calculation)
              lastBlowEndTimeRef.current = currentTime;

              onAnyBlow();

              if (blowDuration >= longBlowThreshold) {
                onLongBlow();
              }

              if (blowDuration >= xlBlowThreshold) {
                onXLBlow();
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
        } catch {
          // If analysis fails for any reason, cleanup gracefully
          cleanupAudioResources();
        }
      };

      // Start the audio analysis loop
      animationFrameRef.current = requestAnimationFrame(analyzeAudioData);
      setIsListening(true);

      return true;
    } catch {
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
    cleanupAudioResources
  ]);

  const stopListening = useCallback(() => {
    cleanupAudioResources();
  }, [cleanupAudioResources]);

  useEffect(() => {
    // Check for browser microphone support on mount
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return;
    }

    return () => {
      cleanupAudioResources();
    };
  }, [cleanupAudioResources]);

  return {
    isListening,
    isBlowing: isBlowingRef.current,
    requestMicrophoneAccess,
    startListening,
    stopListening,
  };
};

export default useBlowDetection;