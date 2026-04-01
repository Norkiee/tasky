import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  /** If true, this option cannot be edited or deleted */
  isStatic?: boolean;
}

interface ContextMenuState {
  optionValue: string;
  x: number;
  y: number;
  confirmingDelete: boolean;
}

interface SelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  onEditOption?: (value: string, newLabel: string) => Promise<void>;
  onDeleteOption?: (value: string) => Promise<void>;
}

export function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
  onEditOption,
  onDeleteOption,
}: SelectProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredValue, setHoveredValue] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [editingValue, setEditingValue] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [saving, setSaving] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayText = selectedOption?.label || placeholder || 'Select...';
  const isPlaceholder = !selectedOption;

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen && !contextMenu) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const inWrapper = wrapperRef.current?.contains(target);
      const inContextMenu = contextMenuRef.current?.contains(target);
      if (!inWrapper && !inContextMenu) {
        setIsOpen(false);
        setContextMenu(null);
        setEditingValue(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, contextMenu]);

  // Focus edit input when it appears
  useEffect(() => {
    if (editingValue !== null) {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }
  }, [editingValue]);

  const handleSelect = (optValue: string) => {
    if (editingValue !== null) return;
    onChange(optValue);
    setIsOpen(false);
    setContextMenu(null);
  };

  const handleContextMenu = (e: React.MouseEvent, opt: SelectOption) => {
    e.preventDefault();
    e.stopPropagation();
    if (opt.isStatic || (!onEditOption && !onDeleteOption)) return;
    setContextMenu({
      optionValue: opt.value,
      x: e.clientX,
      y: e.clientY,
      confirmingDelete: false,
    });
    setIsOpen(true);
  };

  const handleStartEdit = () => {
    if (!contextMenu) return;
    const opt = options.find(o => o.value === contextMenu.optionValue);
    setEditText(opt?.label || '');
    setEditingValue(contextMenu.optionValue);
    setContextMenu(null);
  };

  const handleConfirmEdit = useCallback(async () => {
    if (!editingValue || !onEditOption || !editText.trim()) {
      setEditingValue(null);
      return;
    }
    const opt = options.find(o => o.value === editingValue);
    if (opt?.label === editText.trim()) {
      setEditingValue(null);
      return;
    }
    setSaving(true);
    try {
      await onEditOption(editingValue, editText.trim());
    } finally {
      setSaving(false);
      setEditingValue(null);
    }
  }, [editingValue, editText, onEditOption, options]);

  const handleDeleteClick = () => {
    if (!contextMenu) return;
    setContextMenu({ ...contextMenu, confirmingDelete: true });
  };

  const handleConfirmDelete = async () => {
    if (!contextMenu || !onDeleteOption) return;
    const targetValue = contextMenu.optionValue;
    setContextMenu(null);
    setSaving(true);
    try {
      await onDeleteOption(targetValue);
      if (value === targetValue) onChange('');
    } finally {
      setSaving(false);
    }
  };

  const contextMenuOpt = contextMenu
    ? options.find(o => o.value === contextMenu.optionValue)
    : null;

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }} ref={wrapperRef}>
        {label && (
          <label style={{
            fontSize: '11px',
            fontWeight: 500,
            color: '#666666',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}>
            {label}
          </label>
        )}

        {/* Trigger */}
        <div
          onClick={() => { if (!saving) setIsOpen(o => !o); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            borderRadius: '10px',
            border: `1px solid ${isOpen ? '#8B5CF6' : 'rgba(255,255,255,0.08)'}`,
            background: '#0D0D0D',
            color: isPlaceholder ? '#4A4A4A' : '#FFFFFF',
            fontSize: '13px',
            fontFamily: 'inherit',
            cursor: saving ? 'wait' : 'pointer',
            transition: 'border-color 0.15s, box-shadow 0.15s',
            boxShadow: isOpen ? '0 0 0 3px rgba(139, 92, 246, 0.12)' : 'none',
            userSelect: 'none',
          }}
        >
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {displayText}
          </span>
          <svg
            width="12" height="12" viewBox="0 0 12 12" fill="none"
            style={{ marginLeft: '8px', flexShrink: 0, transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}
          >
            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="#555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Dropdown */}
        {isOpen && options.length > 0 && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            background: '#111111',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            zIndex: 200,
            overflow: 'hidden',
            padding: '4px',
          }}>
            {options.map((opt) => {
              const isSelected = opt.value === value;
              const isHovered = hoveredValue === opt.value;
              const isEditing = editingValue === opt.value;
              const canMutate = !opt.isStatic && (!!onEditOption || !!onDeleteOption);

              return (
                <div
                  key={opt.value || '__placeholder__'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '9px 10px',
                    borderRadius: '8px',
                    cursor: isEditing ? 'default' : 'pointer',
                    background: isEditing
                      ? 'rgba(139, 92, 246, 0.1)'
                      : isHovered
                      ? 'rgba(255,255,255,0.05)'
                      : 'transparent',
                    transition: 'background 0.1s',
                  }}
                  onClick={() => !isEditing && handleSelect(opt.value)}
                  onMouseEnter={() => setHoveredValue(opt.value)}
                  onMouseLeave={() => setHoveredValue(null)}
                  onContextMenu={(e) => handleContextMenu(e, opt)}
                >
                  {/* Selected dot */}
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    flexShrink: 0,
                    background: isSelected ? '#8B5CF6' : 'transparent',
                    border: isSelected ? 'none' : '1px solid transparent',
                    transition: 'background 0.1s',
                  }} />

                  {isEditing ? (
                    <input
                      ref={editInputRef}
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleConfirmEdit();
                        if (e.key === 'Escape') setEditingValue(null);
                        e.stopPropagation();
                      }}
                      onBlur={handleConfirmEdit}
                      onClick={e => e.stopPropagation()}
                      style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: '#FFFFFF',
                        fontSize: '13px',
                        fontFamily: 'inherit',
                        padding: 0,
                      }}
                    />
                  ) : (
                    <span style={{
                      flex: 1,
                      fontSize: '13px',
                      color: isSelected ? '#FFFFFF' : '#A1A1A1',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      transition: 'color 0.1s',
                    }}>
                      {opt.label}
                    </span>
                  )}

                  {/* Right-click hint on hover */}
                  {canMutate && isHovered && !isEditing && (
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, opacity: 0.35 }}>
                      <circle cx="8" cy="3" r="1.5" fill="#fff" />
                      <circle cx="8" cy="8" r="1.5" fill="#fff" />
                      <circle cx="8" cy="13" r="1.5" fill="#fff" />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Context Menu — rendered at cursor position */}
      {contextMenu && contextMenuOpt && (
        <div
          ref={contextMenuRef}
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            background: '#1A1A1A',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            zIndex: 9999,
            minWidth: '160px',
            padding: '4px',
            overflow: 'hidden',
          }}
        >
          {/* Label */}
          <div style={{
            padding: '6px 10px 8px',
            fontSize: '11px',
            color: '#555',
            fontWeight: 500,
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            marginBottom: '4px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {contextMenuOpt.label}
          </div>

          {contextMenu.confirmingDelete ? (
            // Delete confirm state
            <div style={{ padding: '4px 2px' }}>
              <div style={{ fontSize: '12px', color: '#A1A1A1', padding: '4px 10px 8px', lineHeight: 1.4 }}>
                Delete this item?
              </div>
              <div style={{ display: 'flex', gap: '4px', padding: '0 4px' }}>
                <ContextMenuButton
                  label="Cancel"
                  onClick={() => setContextMenu({ ...contextMenu, confirmingDelete: false })}
                  color="#A1A1A1"
                  bg="rgba(255,255,255,0.06)"
                />
                <ContextMenuButton
                  label="Delete"
                  onClick={handleConfirmDelete}
                  color="#EF4444"
                  bg="rgba(239, 68, 68, 0.12)"
                />
              </div>
            </div>
          ) : (
            // Normal state
            <>
              {onEditOption && (
                <ContextMenuItem
                  icon={
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                      <path d="M11.5 2.5a1.414 1.414 0 0 1 2 2L5 13H3v-2L11.5 2.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  }
                  label="Rename"
                  onClick={handleStartEdit}
                />
              )}
              {onDeleteOption && (
                <ContextMenuItem
                  icon={
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                      <path d="M2 4h12M5 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1M6 7v5M10 7v5M3 4l1 9a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  }
                  label="Delete"
                  onClick={handleDeleteClick}
                  danger
                />
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}

function ContextMenuItem({
  icon,
  label,
  onClick,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 10px',
        borderRadius: '7px',
        cursor: 'pointer',
        fontSize: '13px',
        color: danger ? '#EF4444' : '#C0C0C0',
        background: hovered
          ? danger
            ? 'rgba(239, 68, 68, 0.1)'
            : 'rgba(255,255,255,0.06)'
          : 'transparent',
        transition: 'background 0.1s',
      }}
    >
      {icon}
      {label}
    </div>
  );
}

function ContextMenuButton({
  label,
  onClick,
  color,
  bg,
}: {
  label: string;
  onClick: () => void;
  color: string;
  bg: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: 1,
        padding: '6px 8px',
        borderRadius: '6px',
        border: 'none',
        background: hovered ? bg : 'transparent',
        color,
        fontSize: '12px',
        fontWeight: 500,
        fontFamily: 'inherit',
        cursor: 'pointer',
        transition: 'background 0.1s',
      }}
    >
      {label}
    </button>
  );
}
