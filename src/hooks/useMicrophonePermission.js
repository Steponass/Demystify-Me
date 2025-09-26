import { useState, useCallback, useRef, useEffect } from 'react';

const PERMISSION_STATES = {
  UNKNOWN: 'unknown',
  PROMPT: 'prompt', 
  GRANTED: 'granted',
  DENIED: 'denied',
  UNAVAILABLE: 'unavailable'
};

const DENIAL_REASONS = {
  USER_DENIED: 'user_denied',
  BROWSER_BLOCKED: 'browser_blocked', 
  NO_DEVICE: 'no_device',
  BROWSER_UNSUPPORTED: 'browser_unsupported'
};

const useMicrophonePermission = () => {

  const [permissionState, setPermissionState] = useState(PERMISSION_STATES.UNKNOWN);
  const [denialReason, setDenialReason] = useState(null);
  const [hasUserSeenPrompt, setHasUserSeenPrompt] = useState(false);
  const [isRequestInProgress, setIsRequestInProgress] = useState(false);

  const streamRef = useRef(null);
  const permissionCheckTimeoutRef = useRef(null);
  const requestStartTimeRef = useRef(null);

  const checkBrowserMicrophoneSupport = useCallback(() => {
    const isMicrophoneSupported = !!(
      navigator.mediaDevices && 
      navigator.mediaDevices.getUserMedia
    );
    
    if (!isMicrophoneSupported) {
      setPermissionState(PERMISSION_STATES.UNAVAILABLE);
      setDenialReason(DENIAL_REASONS.BROWSER_UNSUPPORTED);
      return false;
    }
    
    return true;
  }, []);

  const checkExistingPermissionState = useCallback(async () => {
    if (!checkBrowserMicrophoneSupport()) {
      return PERMISSION_STATES.UNAVAILABLE;
    }

    try {
      const permissionResult = await navigator.permissions.query({ name: 'microphone' });
      
      setPermissionState(permissionResult.state);
      
      // Clear any previous denial reason if permission is granted
      if (permissionResult.state === PERMISSION_STATES.GRANTED) {
        setDenialReason(null);
      }
      
      return permissionResult.state;
    } catch (permissionQueryError) {
      // Fallback for browsers that don't support permissions API
      console.warn('Permissions API not supported:', permissionQueryError);
      return PERMISSION_STATES.UNKNOWN;
    }
  }, [checkBrowserMicrophoneSupport]);

  const analyzePermissionDenialReason = useCallback((error, requestStartTime) => {
    if (error.name === 'NotAllowedError') {
      const requestDuration = Date.now() - requestStartTime;
      const wasImmediateDenial = requestDuration < 100;
      
      if (wasImmediateDenial && hasUserSeenPrompt) {
        // Cached denial - user previously blocked
        return DENIAL_REASONS.BROWSER_BLOCKED;
      } else {
        // User actively clicked deny this time
        return DENIAL_REASONS.USER_DENIED;
      }
    } else if (error.name === 'NotFoundError') {
      return DENIAL_REASONS.NO_DEVICE;
    } else {
      return DENIAL_REASONS.BROWSER_UNSUPPORTED;
    }
  }, [hasUserSeenPrompt]);

  const cleanupExistingStream = useCallback(() => {
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

// src/hooks/useMicrophonePermission.js - Updated function
const requestMicrophoneAccess = useCallback(async () => {
  // Prevent concurrent requests
  if (isRequestInProgress) {
    return { 
      success: false, 
      state: permissionState, 
      reason: 'request_in_progress' 
    };
  }

  // Return early if we already know it's denied/unavailable
  if (permissionState === PERMISSION_STATES.DENIED || 
      permissionState === PERMISSION_STATES.UNAVAILABLE) {
    return { 
      success: false, 
      state: permissionState, 
      reason: denialReason 
    };
  }

  setIsRequestInProgress(true);
  requestStartTimeRef.current = Date.now();

  try {
    setHasUserSeenPrompt(true);
    
    // Clean up any existing stream first
    cleanupExistingStream();
    
    const microphoneStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      }
    });

    streamRef.current = microphoneStream;
    setPermissionState(PERMISSION_STATES.GRANTED);
    setDenialReason(null);
    setIsRequestInProgress(false);
    
    return { 
      success: true, 
      state: PERMISSION_STATES.GRANTED, 
      stream: microphoneStream 
    };

  } catch (requestError) {
    console.error('Microphone access request failed:', requestError);
    
    const failureReason = analyzePermissionDenialReason(
      requestError, 
      requestStartTimeRef.current
    );
    
    const newState = failureReason === DENIAL_REASONS.NO_DEVICE 
      ? PERMISSION_STATES.UNAVAILABLE 
      : PERMISSION_STATES.DENIED;

    setPermissionState(newState);
    setDenialReason(failureReason);
    setIsRequestInProgress(false);
    
    return { 
      success: false, 
      state: newState, 
      reason: failureReason, 
      error: requestError 
    };
  }
}, [
  permissionState, 
  denialReason, 
  isRequestInProgress, 
  analyzePermissionDenialReason,
  cleanupExistingStream
]);

  const resetPermissionState = useCallback(() => {
    setPermissionState(PERMISSION_STATES.UNKNOWN);
    setDenialReason(null);
    setHasUserSeenPrompt(false);
    cleanupExistingStream();
  }, [cleanupExistingStream]);

  // Check existing permission on mount
  useEffect(() => {
    const initializePermissionCheck = async () => {
      await checkExistingPermissionState();
    };

    initializePermissionCheck();
  }, [checkExistingPermissionState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupExistingStream();
      
      if (permissionCheckTimeoutRef.current) {
        clearTimeout(permissionCheckTimeoutRef.current);
        permissionCheckTimeoutRef.current = null;
      }
    };
  }, [cleanupExistingStream]);

  return {
    permissionState,
    denialReason,
    hasUserSeenPrompt,
    isRequestInProgress,
    checkExistingPermissionState,
    requestMicrophoneAccess,
    resetPermissionState,
    cleanupExistingStream,
    PERMISSION_STATES,
    DENIAL_REASONS
  };
};

export default useMicrophonePermission;