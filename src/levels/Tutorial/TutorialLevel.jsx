import React, { useEffect, useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useGameStore from "@store/gameStore";
import useBlowDetection from "@hooks/useBlowDetection";
import Cloud from "@components/game/Cloud/Cloud";
import HintDisplay from "@components/ui/HintDisplay/HintDisplay";
import NextLevelButton from "@components/ui/NextLevelButton/NextLevelButton";
import BlowIndicator from "@components/ui/BlowIndicator/BlowIndicator";
import MicrophonePermissionFlow from "@components/ui/MicrophonePermissionFlow/MicrophonePermissionFlow";
import { setLevelGradient } from "@utils/backgroundGradient";
import styles from "./TutorialLevel.module.css";

const TUTORIAL_CLOUD_CONFIG = {
  levelId: "tutorial",
  cloudId: "tutorial-cloud",
  cloudType: "A1",
  position: { x: "25%", y: "25%" }, // Centered
  content: {
    layer1: "It is what it is!",
    layer3: "",
  },
};

const TutorialLevel = () => {
  const navigate = useNavigate();

  // Game store integration - removed unused getTutorialState
  const {
    getBlowThreshold,
    initializeClouds,
    getCloudState,
    advanceCloudLayer,
    completeTutorial,
    completeTutorialPermissionSetup,
    isZoomed,
    setZoomState,
    isLevelCompleted,
    getZoomedCloudState,
  } = useGameStore();


  // Tutorial state for rendering
  const [permissionFlowComplete, setPermissionFlowComplete] = useState(false);

  // Tutorial logic state (useRef)
  const isUserTryingRef = useRef(false);
  const tutorialPhaseRef = useRef("initial");
  const strugglingTimeoutRef = useRef(null);
  const hasInitializedCloudsRef = useRef(false);

  // Initialize tutorial cloud when permission flow completes
  useEffect(() => {
    if (permissionFlowComplete && !hasInitializedCloudsRef.current) {
      initializeClouds(TUTORIAL_CLOUD_CONFIG.levelId, [TUTORIAL_CLOUD_CONFIG]);
      hasInitializedCloudsRef.current = true;
    }
  }, [permissionFlowComplete, initializeClouds]);

  const handlePermissionGranted = useCallback(
    (stream) => {
      console.log("Tutorial: Microphone permission granted", stream);
      completeTutorialPermissionSetup();
      setPermissionFlowComplete(true);
    },
    [completeTutorialPermissionSetup]
  );

  const handlePermissionFailed = useCallback((error) => {
    console.error("Tutorial: Microphone permission failed", error);
    // Show error state or guidance
  }, []);

  const handleAudioLevel = useCallback(
    (level) => {
      // Only react when zoomed on the tutorial cloud
      if (!isZoomed) return;
      if (level > 0.1 && !isUserTryingRef.current) {
        isUserTryingRef.current = true;
      }
    },
    [isZoomed]
  );

  const handleCloudRevealed = useCallback(() => {
    // Clear any pending timeout
    if (strugglingTimeoutRef.current) {
      clearTimeout(strugglingTimeoutRef.current);
      strugglingTimeoutRef.current = null;
    }

    // Reset zoom state to match regular level pattern
    setZoomState(false, null);

    tutorialPhaseRef.current = "success";
  }, [setZoomState]);

  const handleAnyBlow = useCallback(() => {
    // Advance tutorial cloud to next layer
    advanceCloudLayer(
      TUTORIAL_CLOUD_CONFIG.levelId,
      TUTORIAL_CLOUD_CONFIG.cloudId
    );

    // Check if cloud is now revealed (layer > 2)
    const cloudState = getCloudState(
      TUTORIAL_CLOUD_CONFIG.levelId,
      TUTORIAL_CLOUD_CONFIG.cloudId
    );
    if (cloudState?.isRevealed) {
      handleCloudRevealed();
    }
  }, [advanceCloudLayer, getCloudState, handleCloudRevealed]);

  // Removed unused microphoneState from destructuring
  const { startListening, stopListening } = useBlowDetection({
    onLevelChange: handleAudioLevel,
    onAnyBlow: handleAnyBlow,
    blowThreshold: getBlowThreshold(),
    onMicrophoneError: (error) => {
      console.error("Tutorial microphone error:", error);
    },
  });

  const handleContinueToLevel1 = useCallback(() => {
    // Complete tutorial in store
    completeTutorial();

    // Navigate to Level 1
    navigate("/level/1");
  }, [completeTutorial, navigate]);

  // Set tutorial gradient and clean up on unmount
  useEffect(() => {
    setLevelGradient("tutorial");

    return () => {
      if (strugglingTimeoutRef.current) {
        clearTimeout(strugglingTimeoutRef.current);
        strugglingTimeoutRef.current = null;
      }
      stopListening();
    };
  }, [stopListening]);

  // Start/stop listening based on being zoomed on the tutorial cloud
  useEffect(() => {
    if (permissionFlowComplete && hasInitializedCloudsRef.current && isZoomed) {
      startListening();
    } else {
      stopListening();
    }
  }, [permissionFlowComplete, isZoomed, startListening, stopListening]);

  const cloudState = getCloudState(
    TUTORIAL_CLOUD_CONFIG.levelId,
    TUTORIAL_CLOUD_CONFIG.cloudId
  );

  // Get the zoomed cloud state to check if it's revealed (for BlowIndicator)
  const zoomedCloudState = getZoomedCloudState(TUTORIAL_CLOUD_CONFIG.levelId);
  const shouldShowBlowIndicator = isZoomed && !zoomedCloudState?.isRevealed;

  // Show permission flow if not yet complete
  if (!permissionFlowComplete) {
    return (
      <div className={styles.tutorialContainer}>
        <div className={styles.permissionSection}>
          <MicrophonePermissionFlow
            onPermissionGranted={handlePermissionGranted}
            onPermissionFailed={handlePermissionFailed}
            showInstructions={true}
            allowSkip={false}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.tutorialContainer}>
      {/* Tutorial Cloud */}
      <div className={styles.cloudSection}>
        {cloudState && (
          <Cloud
            levelId={TUTORIAL_CLOUD_CONFIG.levelId}
            cloudId={TUTORIAL_CLOUD_CONFIG.cloudId}
            position={TUTORIAL_CLOUD_CONFIG.position}
            content={TUTORIAL_CLOUD_CONFIG.content}
            cloudType={TUTORIAL_CLOUD_CONFIG.cloudType}
            onZoomChange={(zoomed) =>
              setZoomState(zoomed, TUTORIAL_CLOUD_CONFIG.cloudId)
            }
          />
        )}
      </div>

      {/* Hint Display */}
      <div className={styles.hintSection}>
        <HintDisplay />
      </div>

      {/* Blow Indicator - shown when zoomed and cloud not revealed */}
      {shouldShowBlowIndicator && (
        <div className={styles.blowIndicatorSection}>
          <BlowIndicator levelId="tutorial" />
        </div>
      )}

      {/* Next Level Button - shown after cloud is revealed and not zoomed */}
      {isLevelCompleted("tutorial") && !isZoomed && (
        <div className={styles.continueSection}>
          <NextLevelButton
            levelId={0}
            forceShow
            onClickOverride={handleContinueToLevel1}
            labelOverride="Start the fun"
          />
        </div>
      )}
    </div>
  );
};

export default TutorialLevel;
