import React from 'react';

interface LoadingSpinnerProps {
  label?: string;
  sublabel?: string;
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid rgba(255, 255, 255, 0.1)',
    borderTopColor: '#8B5CF6',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  label: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#FFFFFF',
  },
  sublabel: {
    fontSize: '12px',
    color: '#A1A1A1',
  },
};

export function LoadingSpinner({
  label,
  sublabel,
}: LoadingSpinnerProps): React.ReactElement {
  return (
    <div style={styles.wrapper}>
      <style>
        {`@keyframes spin { to { transform: rotate(360deg); } }`}
      </style>
      <div style={styles.spinner} />
      {label && <div style={styles.label}>{label}</div>}
      {sublabel && <div style={styles.sublabel}>{sublabel}</div>}
    </div>
  );
}
