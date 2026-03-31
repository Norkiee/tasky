import React, { useRef, useEffect } from 'react';
import { WorkItemType } from '../types';
import { Tag } from './Tag';

interface WorkItemCardProps {
  workItemType: WorkItemType;
  title: string;
  description?: string;
  tags: string[];
  selected: boolean;
  onToggleSelect: () => void;
  onTitleChange: (title: string) => void;
  onDescriptionChange?: (description: string) => void;
  onRemoveTag: (tag: string) => void;
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    backgroundColor: '#141414',
  },
  cardDeselected: {
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    backgroundColor: '#0D0D0D',
    opacity: 0.5,
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    marginTop: '2px',
    cursor: 'pointer',
    accentColor: '#8B5CF6',
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  titleTextarea: {
    padding: '6px 8px',
    borderRadius: '4px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: '#0D0D0D',
    color: '#FFFFFF',
    fontSize: '13px',
    fontWeight: 600,
    fontFamily: 'inherit',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
    resize: 'none' as const,
    overflow: 'hidden',
    lineHeight: '1.4',
    minHeight: '32px',
  },
  textarea: {
    padding: '6px 8px',
    borderRadius: '4px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: '#0D0D0D',
    color: '#A1A1A1',
    fontSize: '12px',
    fontFamily: 'inherit',
    resize: 'vertical' as const,
    outline: 'none',
    lineHeight: '1.4',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  tagsRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '4px',
    alignItems: 'center',
  },
  deselectedText: {
    fontSize: '12px',
    color: '#666666',
    fontStyle: 'italic',
  },
};

export function WorkItemCard({
  workItemType,
  title,
  description,
  tags,
  selected,
  onToggleSelect,
  onTitleChange,
  onDescriptionChange,
  onRemoveTag,
}: WorkItemCardProps): React.ReactElement {
  const getLabels = (): { itemLabel: string; titlePlaceholder: string; hasDescription: boolean } => {
    switch (workItemType) {
      case 'Epic':
        return { itemLabel: 'epic', titlePlaceholder: 'Epic title...', hasDescription: true };
      case 'Feature':
        return { itemLabel: 'feature', titlePlaceholder: 'Feature title...', hasDescription: true };
      case 'UserStory':
        return { itemLabel: 'story', titlePlaceholder: 'As a user, I want... so that...', hasDescription: false };
      case 'Task':
      default:
        return { itemLabel: 'task', titlePlaceholder: 'Task title...', hasDescription: true };
    }
  };

  const { itemLabel, titlePlaceholder, hasDescription } = getLabels();
  const titleRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = 'auto';
      titleRef.current.style.height = `${titleRef.current.scrollHeight}px`;
    }
  }, [title]);

  return (
    <div style={selected ? styles.card : styles.cardDeselected}>
      <div style={styles.checkboxRow}>
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          style={styles.checkbox}
          aria-label={`Select ${itemLabel}: ${title}`}
        />
        <div style={styles.content}>
          {selected ? (
            <>
              <textarea
                ref={titleRef}
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                style={styles.titleTextarea}
                placeholder={titlePlaceholder}
                rows={1}
              />
              {hasDescription && onDescriptionChange && (
                <textarea
                  value={description || ''}
                  onChange={(e) => onDescriptionChange(e.target.value)}
                  rows={3}
                  style={styles.textarea}
                  placeholder="Description..."
                />
              )}
              {tags.length > 0 && (
                <div style={styles.tagsRow}>
                  {tags.map((tag) => (
                    <Tag key={tag} label={tag} onRemove={() => onRemoveTag(tag)} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <span style={styles.deselectedText}>
              {title} (deselected - won't be created)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
