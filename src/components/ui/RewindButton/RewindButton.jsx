import React, { useState } from 'react';
import useGameStore from '@store/gameStore';
import ConfirmationDialog from '@components/ui/ConfirmationDialog/ConfirmationDialog';
import styles from './RewindButton.module.css';
import RewindIcon from '@/assets/images/ui/RewindIcon';

const RewindButton = ({ levelId }) => {
  const rewindLevel = useGameStore(state => state.rewindLevel);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const handleRewindClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmRewind = () => {
    rewindLevel(levelId);
    setShowConfirmDialog(false);
  };

  const handleCancelRewind = () => {
    setShowConfirmDialog(false);
  };

  return (

    <>
      <button 
        className={styles.rewindButton} 
        onClick={handleRewindClick}
        aria-label="Reset level - replay all clouds"
      >
        <RewindIcon />
      </button>

      <ConfirmationDialog
        isOpen={showConfirmDialog}
        title="Replay Level"
        message="Sure you want to replay this level? This will reset all clouds."
        confirmText="Replay"
        cancelText="Cancel"
        onConfirm={handleConfirmRewind}
        onCancel={handleCancelRewind}
      />
    </>
  );
};

export default RewindButton;