import React from "react";
import ActionButton from "@components/ui/ActionButton/ActionButton";
import styles from "./InfoDialog.module.css";

const InfoDialog = ({
  isOpen,
  title,
  children,
  closeText = "Got it",
  onClose,
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      onClose();
    }
  };

  return (
    <div
      className={styles.overlay}
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="info-dialog-title"
      >
        <div className={styles.dialogContent}>
          <h3 className={styles.dialogTitle}>
            {title}
          </h3>
          <div className={styles.dialogBody}>{children}</div>
          <ActionButton variant="primary" onClick={onClose}>
            {closeText}
          </ActionButton>
        </div>
      </div>
    </div>
  );
};

export default InfoDialog;
