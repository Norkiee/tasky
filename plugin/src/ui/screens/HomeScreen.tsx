import React, { useEffect } from 'react';
import { Button } from '../components/Button';

interface HomeScreenProps {
  frameCount: number;
  sectionCount?: number;
  email?: string | null;
  onContinue: () => void;
  onSignOut?: () => void;
}

const styles: Record<string, React.CSSProperties> = {
  iconGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '6px',
    marginBottom: '12px',
  },
  iconSquare: {
    width: '22px',
    height: '22px',
    borderRadius: '5px',
    border: '2.5px solid rgba(255,255,255,0.1)',
  },
  heading: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#FFFFFF',
  },
  subtext: {
    fontSize: '13px',
    color: '#666666',
    maxWidth: '260px',
    lineHeight: '1.5',
  },
};

export function HomeScreen({
  frameCount,
  sectionCount = 0,
  email,
  onContinue,
  onSignOut,
}: HomeScreenProps): React.ReactElement {
  useEffect(() => {
    parent.postMessage(
      { pluginMessage: { type: 'get-selection' } },
      '*'
    );
  }, []);

  const getButtonText = () => {
    if (sectionCount > 0) {
      return `Continue with ${sectionCount} section${sectionCount > 1 ? 's' : ''} (${frameCount} frame${frameCount > 1 ? 's' : ''})`;
    }
    return `Continue with ${frameCount} frame${frameCount > 1 ? 's' : ''}`;
  };

  return (
    <div className="screen" style={{ alignItems: 'center', textAlign: 'center' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <div style={styles.iconGrid}>
          <div style={styles.iconSquare} />
          <div style={styles.iconSquare} />
          <div style={styles.iconSquare} />
          <div style={styles.iconSquare} />
        </div>
        <h2 style={styles.heading}>Select frames or sections</h2>
        <p style={styles.subtext}>
          Select frames or sections in Figma to generate Azure DevOps work items
        </p>
      </div>
      {frameCount > 0 && (
        <div style={{ width: '100%' }}>
          <Button onClick={onContinue} fullWidth>
            {getButtonText()}
          </Button>
        </div>
      )}

      {/* Account strip */}
      {email && onSignOut && (
        <div style={{
          width: '100%',
          marginTop: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 12px',
          background: '#0D0D0D',
          borderRadius: '10px',
          border: '1px solid rgba(255,255,255,0.07)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'rgba(139,92,246,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="5" r="3" stroke="#8B5CF6" strokeWidth="1.5"/>
                <path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span style={{ fontSize: '11px', color: '#A1A1A1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {email}
            </span>
          </div>
          <button
            onClick={onSignOut}
            style={{
              background: 'none',
              border: 'none',
              padding: '2px 6px',
              fontSize: '11px',
              color: '#666666',
              cursor: 'pointer',
              fontFamily: 'inherit',
              flexShrink: 0,
              marginLeft: '8px',
            }}
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
