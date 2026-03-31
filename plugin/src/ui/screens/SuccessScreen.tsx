import React from 'react';
import { WorkItemType } from '../types';
import { Button } from '../components/Button';

interface SuccessScreenProps {
  count: number;
  workItemType?: WorkItemType;
  parentTitle: string;
  onGoHome: () => void;
}

const styles: Record<string, React.CSSProperties> = {
  icon: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'rgba(139, 92, 246, 0.15)',
    color: '#8B5CF6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    margin: '0 auto 12px',
  },
  heading: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#FFFFFF',
  },
  detail: {
    fontSize: '12px',
    color: '#A1A1A1',
  },
  buttons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%',
  },
};

export function SuccessScreen({
  count,
  workItemType = 'Task',
  parentTitle,
  onGoHome,
}: SuccessScreenProps): React.ReactElement {
  const getLabels = (): { singular: string; plural: string; parent: string } => {
    switch (workItemType) {
      case 'Epic':
        return { singular: 'epic', plural: 'epics', parent: 'Project' };
      case 'Feature':
        return { singular: 'feature', plural: 'features', parent: 'Epic' };
      case 'UserStory':
        return { singular: 'user story', plural: 'user stories', parent: 'Parent' };
      case 'Task':
      default:
        return { singular: 'task', plural: 'tasks', parent: 'Story' };
    }
  };

  const { singular, plural, parent } = getLabels();

  return (
    <div className="screen screen-center">
      <div style={styles.icon}>&#10003;</div>
      <h2 style={styles.heading}>
        {count} {count === 1 ? singular : plural} created!
      </h2>
      {parentTitle && (
        <p style={styles.detail}>
          {parent}: {parentTitle}
        </p>
      )}

      <div className="screen-footer" style={styles.buttons}>
        <Button onClick={() => window.open('https://taskscribe.xyz/dashboard', '_blank')} fullWidth>
          View on Tasky
        </Button>
        <Button onClick={onGoHome} variant="secondary" fullWidth>
          Done
        </Button>
      </div>
    </div>
  );
}
