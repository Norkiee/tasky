import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'text';
  disabled?: boolean;
  fullWidth?: boolean;
}

const styles: Record<string, React.CSSProperties> = {
  base: {
    padding: '12px 16px',
    borderRadius: '9999px',
    fontSize: '14px',
    fontWeight: 500,
    fontFamily: "'General Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    cursor: 'pointer',
    border: 'none',
    transition: 'background 0.15s',
    lineHeight: '1.4',
  },
  primary: {
    background: '#8B5CF6',
    color: '#ffffff',
  },
  primaryDisabled: {
    background: '#8B5CF6',
    color: '#ffffff',
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  secondary: {
    background: '#141414',
    color: '#A1A1A1',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  secondaryDisabled: {
    background: '#141414',
    color: '#666666',
    border: '1px solid rgba(255,255,255,0.1)',
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  text: {
    background: 'transparent',
    color: '#8B5CF6',
    padding: '8px 16px',
  },
  textDisabled: {
    background: 'transparent',
    color: '#666666',
    cursor: 'not-allowed',
    padding: '8px 16px',
  },
  fullWidth: {
    width: '100%',
  },
};

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  fullWidth = false,
}: ButtonProps): React.ReactElement {
  const getVariantStyle = () => {
    if (disabled) {
      if (variant === 'primary') return styles.primaryDisabled;
      if (variant === 'text') return styles.textDisabled;
      return styles.secondaryDisabled;
    }
    if (variant === 'primary') return styles.primary;
    if (variant === 'text') return styles.text;
    return styles.secondary;
  };

  const variantStyle = getVariantStyle();

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        ...styles.base,
        ...variantStyle,
        ...(fullWidth ? styles.fullWidth : {}),
      }}
    >
      {children}
    </button>
  );
}
