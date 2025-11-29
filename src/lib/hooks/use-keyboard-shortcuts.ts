'use client';

import { useEffect } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  callback: () => void;
  description?: string;
}

/**
 * Hook for managing keyboard shortcuts
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs, textareas, or contenteditable elements
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      shortcuts.forEach((shortcut) => {
        const matches =
          shortcut.key.toLowerCase() === e.key.toLowerCase() &&
          (shortcut.ctrlKey === undefined || shortcut.ctrlKey === e.ctrlKey) &&
          (shortcut.shiftKey === undefined || shortcut.shiftKey === e.shiftKey) &&
          (shortcut.altKey === undefined || shortcut.altKey === e.altKey) &&
          (shortcut.metaKey === undefined || shortcut.metaKey === e.metaKey);

        if (matches) {
          e.preventDefault();
          shortcut.callback();
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);
}

/**
 * Common keyboard shortcuts for admin panel
 */
export const commonShortcuts = {
  search: {
    key: 'k',
    ctrlKey: true,
    description: 'Focus search',
  },
  refresh: {
    key: 'r',
    ctrlKey: true,
    description: 'Refresh data',
  },
  new: {
    key: 'n',
    ctrlKey: true,
    description: 'Create new item',
  },
  close: {
    key: 'Escape',
    description: 'Close dialog/modal',
  },
};

