import React, { useEffect, useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useGameStore from "@store/gameStore";
import Cloud from "@components/game/Cloud/Cloud";
import NextLevelButton from "@components/ui/NextLevelButton/NextLevelButton";
import MicrophonePermissionFlow from "@components/ui/MicrophonePermissionFlow/MicrophonePermissionFlow";
import { setLevelGradient } from "@utils/backgroundGradient";
import styles from "@levels/Level.module.css";
import tutorialStyles from "./TutorialLevel.module.css";

const TUTORIAL_CLOUD_CONFIG = {
  levelId: "tutorial",
  cloudId: "tutorial-cloud",
  cloudType: "A1",
  position: { x: "35%", y: "15%" }, // Centered
  content: {
    layer1: "Blow me away!",
    layer3: "Nice! Click anywhere",
  },
};

const TutorialLevel = () => {
  const navigate = useNavigate();

  // Game store integration
  const {
    initializeClouds,
    getCloudState,
    completeTutorial,
    completeTutorialPermissionSetup,
    isLevelCompleted,
  } = useGameStore();


  // Tutorial state for rendering
  const [permissionFlowComplete, setPermissionFlowComplete] = useState(false);

  // Tutorial logic state (useRef)
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


  const handleCloudRevealed = useCallback(() => {
    // Clear any pending timeout
    if (strugglingTimeoutRef.current) {
      clearTimeout(strugglingTimeoutRef.current);
      strugglingTimeoutRef.current = null;
    }

    tutorialPhaseRef.current = "success";
  }, []);

  const handleCloudReveal = useCallback(() => {
    handleCloudRevealed();
  }, [handleCloudRevealed]);


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
    };
  }, []);


  const cloudState = getCloudState(
    TUTORIAL_CLOUD_CONFIG.levelId,
    TUTORIAL_CLOUD_CONFIG.cloudId
  );

  // Show permission flow if not yet complete
  if (!permissionFlowComplete) {
    return (
      <main>
        <div className={styles.cloud_layout}>
          <div className={tutorialStyles.permissionSection}>
            <MicrophonePermissionFlow
              onPermissionGranted={handlePermissionGranted}
              onPermissionFailed={handlePermissionFailed}
              showInstructions={true}
              allowSkip={false}
            />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className={styles.cloud_layout}>
        {cloudState && (
          <Cloud
            levelId={TUTORIAL_CLOUD_CONFIG.levelId}
            cloudId={TUTORIAL_CLOUD_CONFIG.cloudId}
            position={TUTORIAL_CLOUD_CONFIG.position}
            content={TUTORIAL_CLOUD_CONFIG.content}
            cloudType={TUTORIAL_CLOUD_CONFIG.cloudType}
            onReveal={handleCloudReveal}
          />
        )}

        {/* Tutorial-specific completion button */}
        {isLevelCompleted("tutorial") && (
          <div className={tutorialStyles.continueSection}>
            <NextLevelButton
              levelId={0}
              forceShow
              onClickOverride={handleContinueToLevel1}
              labelOverride="Start the fun"
            />
          </div>
        )}
      </div>
    </main>
  );
};

export default TutorialLevel;
