import React from 'react';

interface FrameChipProps {
  name: string;
}

const style: React.CSSProperties = {
  display: 'inline-block',
  padding: '4px 12px',
  borderRadius: '16px',
  fontSize: '12px',
  fontWeight: 500,
  background: 'rgba(255, 255, 255, 0.05)',
  color: '#A1A1A1',
};

export function FrameChip({ name }: FrameChipProps): React.ReactElement {
  return <span style={style}>{name}</span>;
}
