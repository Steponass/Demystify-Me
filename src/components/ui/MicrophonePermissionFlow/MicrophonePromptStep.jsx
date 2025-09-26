import React from "react";
import ActionButton from "@components/ui/ActionButton/ActionButton";
import styles from "./MicrophonePermissionFlow.module.css";

const MicrophonePromptStep = ({
  permissionState,
  attemptCount = 1,
  isRequestInProgress = false,
  onRequestPermission,
  onRetry,
  onGiveUp = null,
}) => {
  const getPromptContent = () => {
    switch (permissionState) {
      case "prompt":
        return {
          title: "Microphone Access Required",
          message:
            "Your browser will ask for microphone permission, please allow it",
          buttonText: "Enable Microphone",
          buttonVariant: "primary",
          showButton: true,
          isError: false,
        };
      case "granted":
        return {
          title: "Microphone Ready",
          message: "Permission already granted. Continue to the tutorial.",
          buttonText: "Continue",
          buttonVariant: "primary",
          showButton: true,
          isError: false,
        };

      case "retry":
        return {
          title: "Try Again",
          message: `Microphone access was blocked. Let's try once more: when prompted, select "Allow".`,
          buttonText: "Try Again",
          buttonVariant: "primary",
          showButton: true,
          isError: false,
        };

      case "blocked":
        return {
          title: "Cannot Continue",
          message:
            "No mic access? This experience won't work 😿. Enable mic permissions and refresh page.",
          buttonText: null,
          buttonVariant: null,
          showButton: false,
          isError: true,
        };

      case "unavailable":
        return {
          title: "Microphone Not Available",
          message:
            "No microphone detected or your browser doesn't support mic access. Don't think this is going to work 😭.",
          buttonText: "Try Again",
          buttonVariant: "secondary",
          showButton: true,
          isError: true,
        };

      default:
        return {
          title: "Setting Up Microphone",
          message: "Preparing microphone access...",
          buttonText: null,
          buttonVariant: null,
          showButton: false,
          isError: false,
        };
    }
  };

  const handleButtonClick = () => {
    if (permissionState === "prompt") {
      onRequestPermission();
    } else if (permissionState === "granted") {
      // Treat as success path by invoking retry handler which will call parent's flow complete logic
      onRetry();
    } else {
      onRetry();
    }
  };

  const content = getPromptContent();

  return (
    <div
      className={`${styles.promptStep} ${
        content.isError ? styles.errorStep : ""
      }`}
    >
      <div className={styles.promptContent}>
        <h3 className={styles.promptTitle}>{content.title}</h3>
        <p className={styles.promptMessage}>{content.message}</p>

        {attemptCount > 1 && permissionState !== "blocked" && (
          <p className={styles.attemptCounter}>Attempt {attemptCount}</p>
        )}

        {content.showButton && (
          <div className={styles.promptActions}>
            <ActionButton
              variant={content.buttonVariant}
              onClick={handleButtonClick}
              disabled={isRequestInProgress}
            >
              {isRequestInProgress ? "Requesting..." : content.buttonText}
            </ActionButton>

            {onGiveUp && permissionState === "retry" && (
              <ActionButton
                variant="secondary"
                onClick={onGiveUp}
                className={styles.giveUpButton}
              >
                Skip Tutorial
              </ActionButton>
            )}
          </div>
        )}

        {content.isError && permissionState === "blocked" && (
          <div className={styles.refreshHint}>
            <p className={styles.refreshText}>
              After enabling microphone access, refresh this page.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MicrophonePromptStep;
