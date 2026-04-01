import React, { useEffect, useState, useRef } from 'react';
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

      {/* Account pill */}
      {email && onSignOut && (
        <AccountPill email={email} onSignOut={onSignOut} />
      )}
    </div>
  );
}

function AccountPill({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Truncate email for display
  const displayEmail = email.length > 24 ? email.slice(0, 22) + '…' : email;

  return (
    <div ref={ref} style={{ position: 'relative', marginTop: '12px' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 10px 5px 6px',
          background: '#0D0D0D',
          border: `1px solid ${open ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: '999px',
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: 'border-color 0.15s',
        }}
      >
        {/* Avatar dot */}
        <div style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: 'rgba(139,92,246,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="5.5" r="2.5" stroke="#8B5CF6" strokeWidth="1.5" />
            <path d="M2.5 14c0-2.761 2.462-4.5 5.5-4.5s5.5 1.739 5.5 4.5" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <span style={{ fontSize: '11px', color: '#A1A1A1', whiteSpace: 'nowrap' }}>
          {displayEmail}
        </span>
        {/* Chevron */}
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none"
          style={{ transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'none', marginLeft: '2px' }}
        >
          <path d="M2 3.5L5 6.5L8 3.5" stroke="#555" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 6px)',
          left: 0,
          background: '#1A1A1A',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '10px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          padding: '4px',
          minWidth: '160px',
          zIndex: 100,
        }}>
          {/* Email header */}
          <div style={{ padding: '6px 10px 8px', fontSize: '11px', color: '#555', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {email}
          </div>
          <button
            onClick={() => { setOpen(false); onSignOut(); }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 10px',
              background: 'none',
              border: 'none',
              borderRadius: '7px',
              fontSize: '13px',
              color: '#EF4444',
              cursor: 'pointer',
              fontFamily: 'inherit',
              textAlign: 'left',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M6 3H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h3M10 11l3-3-3-3M13 8H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
