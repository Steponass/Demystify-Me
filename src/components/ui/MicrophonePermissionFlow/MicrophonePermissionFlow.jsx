import React, { useState, useEffect, useCallback, useRef } from "react";
import useMicrophonePermission from "@hooks/useMicrophonePermission";
import useGameStore from "@store/gameStore";
import MicrophonePromptStep from "./MicrophonePromptStep";
import styles from "./MicrophonePermissionFlow.module.css";

const MicrophonePermissionFlow = ({
  onPermissionGranted,
  onPermissionFailed,
  onFlowComplete,
  allowSkip = false,
}) => {
  // Only destructure what we use
  const {
    isRequestInProgress,
    checkExistingPermissionState,
    requestMicrophoneAccess,
    resetPermissionState,
    PERMISSION_STATES,
    DENIAL_REASONS,
  } = useMicrophonePermission();

  // ditto
  const { tutorialState, completeTutorialPermissionSetup } = useGameStore();

  // Component state for flow management
  const [currentFlowStep, setCurrentFlowStep] = useState("initializing");
  const [attemptCount, setAttemptCount] = useState(0);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Refs for preventing duplicate requests
  const initializationTimeoutRef = useRef(null);
  const isProcessingRequestRef = useRef(false);

  const handlePermissionSuccess = useCallback(
    (stream) => {
      // Update tutorial state if we're in tutorial context
      if (tutorialState === "permission_setup") {
        completeTutorialPermissionSetup();
      }

      // Notify parent component
      if (onPermissionGranted) {
        onPermissionGranted(stream);
      }

      // Mark flow as complete
      if (onFlowComplete) {
        onFlowComplete({ success: true, stream });
      }
    },
    [
      tutorialState,
      completeTutorialPermissionSetup,
      onPermissionGranted,
      onFlowComplete,
    ]
  );

  const handlePermissionFailure = useCallback(
    (error) => {
      // Update flow step based on error type
      if (
        error.reason === DENIAL_REASONS.USER_DENIED ||
        error.reason === DENIAL_REASONS.BROWSER_BLOCKED
      ) {
        if (attemptCount >= 2) {
          setCurrentFlowStep("permission_blocked_final");
        } else {
          setCurrentFlowStep("permission_denied_retry");
        }
      } else if (
        error.reason === DENIAL_REASONS.NO_DEVICE ||
        error.reason === DENIAL_REASONS.BROWSER_UNSUPPORTED
      ) {
        setCurrentFlowStep("permission_unavailable");
      }

      // Notify parent component
      if (onPermissionFailed) {
        onPermissionFailed(error);
      }
    },
    [
      attemptCount,
      onPermissionFailed,
      DENIAL_REASONS.USER_DENIED,
      DENIAL_REASONS.BROWSER_BLOCKED,
      DENIAL_REASONS.NO_DEVICE,
      DENIAL_REASONS.BROWSER_UNSUPPORTED,
    ]
  );

  // Initialize permission checking on mount
  useEffect(() => {
    const initializePermissionFlow = async () => {
      if (hasInitialized) return;

      try {
        const existingPermissionState = await checkExistingPermissionState();

        if (existingPermissionState === PERMISSION_STATES.GRANTED) {
          // Permission is already granted. Keep the UI visible and let the user continue explicitly
          // so the flow doesn't flash away immediately.
          setCurrentFlowStep("granted_ready");
        } else if (existingPermissionState === PERMISSION_STATES.DENIED) {
          setCurrentFlowStep("permission_denied");
        } else if (existingPermissionState === PERMISSION_STATES.UNAVAILABLE) {
          setCurrentFlowStep("permission_unavailable");
        } else {
          setCurrentFlowStep("prompt_needed");
        }

        setHasInitialized(true);
      } catch (initializationError) {
        console.error(
          "Permission flow initialization failed:",
          initializationError
        );
        setCurrentFlowStep("prompt_needed");
        setHasInitialized(true);
      }
    };

    // Small delay to avoid UI flash
    initializationTimeoutRef.current = setTimeout(
      initializePermissionFlow,
      100
    );

    return () => {
      if (initializationTimeoutRef.current) {
        clearTimeout(initializationTimeoutRef.current);
        initializationTimeoutRef.current = null;
      }
    };
  }, [
    hasInitialized,
    checkExistingPermissionState,
    requestMicrophoneAccess,
    PERMISSION_STATES.GRANTED,
    PERMISSION_STATES.DENIED,
    PERMISSION_STATES.UNAVAILABLE,
    handlePermissionSuccess,
  ]);

  const handleRequestPermission = useCallback(async () => {
    if (isProcessingRequestRef.current || isRequestInProgress) {
      return;
    }

    isProcessingRequestRef.current = true;
    const newAttemptCount = attemptCount + 1;
    setAttemptCount(newAttemptCount);

    try {
      const result = await requestMicrophoneAccess();

      if (result.success) {
        handlePermissionSuccess(result.stream);
      } else {
        handlePermissionFailure(result);
      }
    } catch (requestError) {
      console.error("Permission request failed:", requestError);
      handlePermissionFailure({
        reason: DENIAL_REASONS.BROWSER_UNSUPPORTED,
        error: requestError,
      });
    } finally {
      isProcessingRequestRef.current = false;
    }
  }, [
    attemptCount,
    isRequestInProgress,
    requestMicrophoneAccess,
    handlePermissionSuccess,
    handlePermissionFailure,
    DENIAL_REASONS.BROWSER_UNSUPPORTED,
  ]);

  const handleRetryPermission = useCallback(async () => {
    // Reset permission state and try again
    resetPermissionState();
    setCurrentFlowStep("prompt_needed");

    // Small delay to ensure state reset takes effect
    setTimeout(() => {
      handleRequestPermission();
    }, 100);
  }, [resetPermissionState, handleRequestPermission]);

  const handleContinueWhenGranted = useCallback(async () => {
    try {
      const result = await requestMicrophoneAccess();
      if (result.success) {
        handlePermissionSuccess(result.stream);
      } else {
        setCurrentFlowStep("prompt_needed");
      }
    } catch {
      setCurrentFlowStep("prompt_needed");
    }
  }, [requestMicrophoneAccess, handlePermissionSuccess]);

  const handleSkipTutorial = useCallback(() => {
    if (allowSkip && onFlowComplete) {
      onFlowComplete({ success: false, skipped: true });
    }
  }, [allowSkip, onFlowComplete]);

  const getPromptStepProps = () => {
    const baseProps = {
      attemptCount,
      isRequestInProgress,
      onRequestPermission: handleRequestPermission,
      onRetry: handleRetryPermission,
      onGiveUp: allowSkip ? handleSkipTutorial : null,
    };

    switch (currentFlowStep) {
      case "prompt_needed":
        return { ...baseProps, permissionState: "prompt" };
      case "granted_ready":
        return {
          ...baseProps,
          permissionState: "granted",
          onRetry: handleContinueWhenGranted,
        };
      case "permission_denied_retry":
        return { ...baseProps, permissionState: "retry" };
      case "permission_blocked_final":
        return { ...baseProps, permissionState: "blocked" };
      case "permission_unavailable":
        return { ...baseProps, permissionState: "unavailable" };
      default:
        return { ...baseProps, permissionState: "prompt" };
    }
  };

  const renderFlowContent = () => {
    if (!hasInitialized) {
      return (
        <div className={styles.loadingState}>
          <p>Checking microphone permissions...</p>
        </div>
      );
    }

    if (currentFlowStep === "testing_existing_permission") {
      return (
        <div className={styles.loadingState}>
          <p>Testing microphone access...</p>
        </div>
      );
    }

    // All other states use the MicrophonePromptStep
    return <MicrophonePromptStep {...getPromptStepProps()} />;
  };

  return (
    <div className={styles.permissionFlow}>
      {renderFlowContent()}
    </div>
  );
};

export default MicrophonePermissionFlow;
