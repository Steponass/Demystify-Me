import React from 'react';
import styles from './ActionButton.module.css';

const ActionButton = ({ 
  children, 
  onClick, 
  variant = 'primary',
  className = '',
  disabled = false,
  'aria-label': ariaLabel,
  ...props 
}) => {
  const buttonClassName = [
    styles.actionButton,
    styles[`${variant}Button`],
    className
  ].filter(Boolean).join(' ');

  return (
    <button 
      className={buttonClassName}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </button>
  );
};

export default ActionButton;