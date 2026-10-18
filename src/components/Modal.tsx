import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  onClose: () => void;
  className?: string;
  ariaLabel?: string;
  children: React.ReactNode;
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

/**
 * Shared dialog shell: backdrop click and Escape close it, Tab/Shift+Tab stay inside it,
 * and focus returns to the element that opened it once it closes (or to the dialog underneath
 * if that element is gone).
 * Rendered into <body> so a dialog opened from inside another dialog stacks on top of it.
 */
export const Modal: React.FC<ModalProps> = ({ onClose, className = '', ariaLabel, children }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const content = contentRef.current;

    // Focus the dialog itself rather than its first button, so a stray Enter/Space
    // can't trigger an action and mobile keyboards don't pop up for inputs
    content?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only the topmost dialog reacts when dialogs are stacked
      const dialogs = document.querySelectorAll('[aria-modal="true"]');
      if (dialogs[dialogs.length - 1] !== content) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }

      if (e.key !== 'Tab' || !content) return;

      const focusable = Array.from(content.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && (active === first || active === content)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !content.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocused?.isConnected) {
        previouslyFocused.focus();
      } else {
        // The opener is gone (e.g. the row of a goalie just deleted): keep focus in the
        // dialog underneath, if any, rather than dropping it on the page
        const dialogs = document.querySelectorAll<HTMLElement>('[aria-modal="true"]');
        dialogs[dialogs.length - 1]?.focus();
      }
    };
  }, []);

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={contentRef}
        className={`modal-content ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};
