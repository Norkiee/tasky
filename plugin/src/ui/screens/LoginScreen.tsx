import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { getPluginLoginUrl, pollPluginAuth, Session } from '../services/api';

interface LoginScreenProps {
  onLogin: (session: Session, email: string) => void;
  onBack: () => void;
}

function generateCode(): string {
  return 'xxxx-xxxx-xxxx'.replace(/x/g, () =>
    Math.floor(Math.random() * 16).toString(16)
  );
}

export function LoginScreen({ onLogin, onBack }: LoginScreenProps): React.ReactElement {
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const codeRef = useRef<string>('');

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setPolling(false);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const handleSignIn = () => {
    setError(null);
    const code = generateCode();
    codeRef.current = code;

    const url = getPluginLoginUrl(code);
    window.open(url, '_blank');

    setPolling(true);

    intervalRef.current = setInterval(async () => {
      try {
        const result = await pollPluginAuth(code);
        if (result.status === 'complete') {
          stopPolling();
          onLogin(result.session, result.email);
        }
      } catch {
        // Keep polling on network errors
      }
    }, 2000);

    // Stop polling after 5 minutes
    setTimeout(() => {
      if (intervalRef.current) {
        stopPolling();
        setError('Login timed out. Please try again.');
      }
    }, 5 * 60 * 1000);
  };

  const handleCancel = () => {
    stopPolling();
  };

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <h2>Sign In</h2>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', textAlign: 'center' }}>
        {polling ? (
          <>
            <LoadingSpinner
              label="Waiting for sign in..."
              sublabel="Complete sign in in your browser"
            />
            <Button onClick={handleCancel} variant="text">
              Cancel
            </Button>
          </>
        ) : (
          <>
            <p style={{ fontSize: '13px', color: '#A1A1A1', maxWidth: '260px', lineHeight: '1.5' }}>
              Sign in through your browser to connect the plugin to your TaskScribe account.
            </p>
            {error && <p style={{ fontSize: '12px', color: '#EF4444' }}>{error}</p>}
            <Button onClick={handleSignIn} fullWidth>
              Sign in with browser
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
