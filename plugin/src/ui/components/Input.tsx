import React from 'react';

interface InputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  error?: string;
  type?: 'text' | 'email' | 'password';
  maxLength?: number;
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontSize: '12px',
    fontWeight: 500,
    color: '#666666',
  },
  input: {
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: '#0D0D0D',
    color: '#FFFFFF',
    fontSize: '13px',
    fontFamily: 'inherit',
    resize: 'vertical' as const,
    outline: 'none',
    transition: 'border-color 0.15s',
  },
  error: {
    fontSize: '11px',
    color: '#EF4444',
  },
};

export function Input({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
  rows = 3,
  error,
  type = 'text',
  maxLength,
}: InputProps): React.ReactElement {
  const inputStyle = {
    ...styles.input,
    ...(error ? { borderColor: '#EF4444' } : {}),
  };

  return (
    <div style={styles.wrapper}>
      {label && <label style={styles.label}>{label}</label>}
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          style={inputStyle}
          maxLength={maxLength}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={inputStyle}
          maxLength={maxLength}
        />
      )}
      {error && <span style={styles.error}>{error}</span>}
    </div>
  );
}
