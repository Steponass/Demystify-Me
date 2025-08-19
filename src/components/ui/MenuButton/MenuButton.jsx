import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './MenuButton.module.css';
import MenuIcon from '@/assets/images/ui/MenuIcon';

const MenuButton = () => {
  const navigate = useNavigate();

  const handleMenuButton = () => {
    navigate('/');
  };

  return (
    <button
      className={styles.menuButton}
      onClick={handleMenuButton}
      aria-label="Back to menu screen"
    >
      <MenuIcon />
    </button>
  );
};

export default memo(MenuButton);