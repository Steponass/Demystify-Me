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

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.content}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.message}>{message}</p>
          
          <div className={styles.actions}>
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