import { useCallback, useEffect, useRef, useState } from "react";
import { MediaLike } from "../types";

export interface UseLightboxOptions<T extends MediaLike> {
  items: T[];
  initialIndex?: number;
  onClose?: () => void;
  onIndexChange?: (index: number, item: T) => void;
}

export interface DialogProps {
  role: "dialog";
  "aria-modal": true;
  "aria-label": string;
  onKeyDown: (e: React.KeyboardEvent) => void;
  ref: (node: HTMLElement | null) => void;
  tabIndex: -1;
}

export interface UseLightboxResult<T extends MediaLike> {
  isOpen: boolean;
  activeItem: T | null;
  activeIndex: number;
  open: (index: number) => void;
  close: () => void;
  next: () => void;
  prev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
  /** spread onto the dialog container — wires focus trap + Escape/Arrow keys */
  getDialogProps: () => DialogProps;
}

/**
 * Headless lightbox: owns open/close/navigation state, keyboard handling
 * (Escape, ArrowLeft/Right), and a focus trap on web. Renders nothing —
 * the consumer supplies every pixel of markup.
 */
export function useLightbox<T extends MediaLike>(
  options: UseLightboxOptions<T>
): UseLightboxResult<T> {
  const { items, initialIndex = 0, onClose, onIndexChange } = options;
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const containerRef = useRef<HTMLElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const activeItem = isOpen ? items[activeIndex] ?? null : null;

  const open = useCallback(
    (index: number) => {
      previouslyFocused.current = (document.activeElement as HTMLElement) ?? null;
      setActiveIndex(index);
      setIsOpen(true);
    },
    []
  );

  const close = useCallback(() => {
    setIsOpen(false);
    onClose?.();
    previouslyFocused.current?.focus?.();
  }, [onClose]);

  const goTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= items.length) return;
      setActiveIndex(index);
      onIndexChange?.(index, items[index]);
    },
    [items, onIndexChange]
  );

  const next = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
  const prev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

  // focus trap + initial focus, web only
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;
    const node = containerRef.current;
    node.focus();

    function handleFocusTrap(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      const focusable = node.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleFocusTrap);
    return () => document.removeEventListener("keydown", handleFocusTrap);
  }, [isOpen]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    },
    [close, next, prev]
  );

  const getDialogProps = useCallback(
    (): DialogProps => ({
      role: "dialog",
      "aria-modal": true,
      "aria-label": activeItem?.alt ?? "Media viewer",
      onKeyDown,
      ref: (node) => {
        containerRef.current = node;
      },
      tabIndex: -1,
    }),
    [activeItem, onKeyDown]
  );

  return {
    isOpen,
    activeItem,
    activeIndex,
    open,
    close,
    next,
    prev,
    hasNext: activeIndex < items.length - 1,
    hasPrev: activeIndex > 0,
    getDialogProps,
  };
}
