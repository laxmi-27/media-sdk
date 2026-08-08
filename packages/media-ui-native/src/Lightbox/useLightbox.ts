import { useCallback, useState } from "react";
import { MediaLike } from "../types";

export interface UseLightboxOptions<T extends MediaLike> {
  items: T[];
  initialIndex?: number;
  onClose?: () => void;
  onIndexChange?: (index: number, item: T) => void;
}

export interface ModalProps {
  visible: boolean;
  transparent: true;
  animationType: "fade";
  onRequestClose: () => void;
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
  getModalProps: () => ModalProps;
}

export function useLightbox<T extends MediaLike>(
  options: UseLightboxOptions<T>
): UseLightboxResult<T> {
  const { items, initialIndex = 0, onClose, onIndexChange } = options;
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  const activeItem = isOpen ? items[activeIndex] ?? null : null;

  const open = useCallback((index: number) => {
    setActiveIndex(index);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    onClose?.();
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

  const getModalProps = useCallback(
    (): ModalProps => ({
      visible: isOpen,
      transparent: true,
      animationType: "fade",
      onRequestClose: close,
    }),
    [isOpen, close]
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
    getModalProps,
  };
}
