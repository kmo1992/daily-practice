import React, { useState, useEffect } from 'react';

// Inline chevron SVG
const ChevronIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 4 10 8 6 12" />
  </svg>
);

function JournalEntry({ text, onSave, disabled, onAutoCheck }) {
  const [localText, setLocalText] = useState(text || '');
  const [isExpanded, setIsExpanded] = useState(false);

  // Sync local text when prop changes (e.g., navigating days)
  useEffect(() => {
    setLocalText(text || '');
  }, [text]);

  // Auto-expand if there's existing text (past day review)
  useEffect(() => {
    if (text && text.trim().length > 0) {
      setIsExpanded(true);
    }
  }, [text]);

  const hasText = localText.trim().length > 0;
  const hasChanges = localText !== (text || '');
  const wordCount = hasText ? localText.trim().split(/\s+/).length : 0;

  const handleSave = () => {
    onSave(localText);
    if (hasText) {
      onAutoCheck();
    }
  };

  const handleToggle = () => {
    if (!disabled || hasText) {
      setIsExpanded((prev) => !prev);
    }
  };

  return (
    <div className="journal">
      <div
        className={`journal-toggle ${disabled && !hasText ? 'journal-toggle--disabled' : ''}`}
        onClick={handleToggle}
        role="button"
        tabIndex={0}
      >
        <span className={`journal-chevron ${isExpanded ? 'journal-chevron--expanded' : ''}`}>
          <ChevronIcon />
        </span>
        <span className={`journal-title ${hasText ? 'journal-title--has-text' : ''}`}>
          Journal
        </span>
      </div>

      <div className={`journal-body ${isExpanded ? 'journal-body--expanded' : ''}`}>
        <textarea
          className="journal-textarea"
          value={localText}
          onChange={(e) => setLocalText(e.target.value)}
          placeholder="How was today? What went well? What will you do differently tomorrow?"
          readOnly={disabled}
        />
        <div className="journal-footer">
          <span className="journal-word-count">
            {hasText ? `${wordCount} word${wordCount !== 1 ? 's' : ''}` : ''}
          </span>
          {!disabled && (
            <button
              className="journal-save-btn"
              type="button"
              onClick={handleSave}
              disabled={!hasChanges}
            >
              Save
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default JournalEntry;
