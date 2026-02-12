'use client';

import { useEffect } from 'react';

interface KeyboardShortcutHandlers {
  onSpacebar?: () => void;
}

/**
 * Registers keyboard shortcuts for the interview experience.
 * Spacebar toggles recording (disabled when focus is on text inputs).
 */
export function useKeyboardShortcuts({ onSpacebar }: KeyboardShortcutHandlers) {
  useEffect(() => {
    if (!onSpacebar) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      // Ignore if contentEditable
      if ((e.target as HTMLElement)?.isContentEditable) return;

      if (e.code === 'Space') {
        e.preventDefault();
        onSpacebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSpacebar]);
}
