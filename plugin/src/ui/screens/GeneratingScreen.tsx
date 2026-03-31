import React from 'react';
import { FrameData, WorkItemType } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface GeneratingScreenProps {
  frames: FrameData[];
  workItemType?: WorkItemType;
  completedFrameIds: Set<string>;
}

const styles: Record<string, React.CSSProperties> = {
  currentFrame: {
    marginTop: '20px',
    padding: '12px 16px',
    background: 'rgba(139, 92, 246, 0.15)',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 500,
    color: '#8B5CF6',
    textAlign: 'center',
    maxWidth: '280px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  progress: {
    marginTop: '8px',
    fontSize: '12px',
    color: '#666666',
  },
};

export function GeneratingScreen({
  frames,
  workItemType = 'Task',
  completedFrameIds,
}: GeneratingScreenProps): React.ReactElement {
  const completedCount = completedFrameIds.size;
  const totalCount = frames.length;

  const getItemLabel = (): string => {
    switch (workItemType) {
      case 'Epic': return 'epics';
      case 'Feature': return 'features';
      case 'UserStory': return 'user stories';
      case 'Task': return 'tasks';
      default: return 'work items';
    }
  };

  const itemLabel = getItemLabel();

  // Find the current frame being processed
  const currentFrame = frames.find(f => !completedFrameIds.has(f.id));

  return (
    <div className="screen screen-center">
      <LoadingSpinner
        label={`Generating ${itemLabel}...`}
        sublabel={totalCount > 1
          ? `Frame ${completedCount + 1} of ${totalCount}`
          : 'Analyzing your design'
        }
      />
      {currentFrame && (
        <div style={styles.currentFrame}>
          {currentFrame.name}
        </div>
      )}
      {totalCount > 1 && (
        <p style={styles.progress}>
          {completedCount} of {totalCount} frames complete
        </p>
      )}
    </div>
  );
}
