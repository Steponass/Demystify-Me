import React from 'react';
import ActionButton from '@components/ui/ActionButton/ActionButton';
import styles from './ConfirmationDialog.module.css';

const ConfirmationDialog = ({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div className={styles.confirmationOverlay}
      onClick={onCancel}
      onKeyDown={handleKeyDown}
      >
      <div className={styles.confirmationDialog} 
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      >
        <div className={styles.confirmationContent}>
          <h3 className={styles.confirmationTitle}>{title}</h3>
          <p className={styles.confirmationMessage}>{message}</p>

          <div className={styles.confirmationActions}>
            <ActionButton
              variant="secondary"
              onClick={onCancel}
            >
              {cancelText}
            </ActionButton>
            <ActionButton
              variant="primary"
              onClick={onConfirm}
            >
              {confirmText}
            </ActionButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;