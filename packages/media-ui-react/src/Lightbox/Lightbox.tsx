import React, { useEffect, useRef } from "react";
import { MediaLike } from "../types";
import { useLightbox, UseLightboxOptions } from "./useLightbox";

export interface LightboxProps<T extends MediaLike> extends UseLightboxOptions<T> {
  isOpenControlled?: boolean;
  renderContent: (item: T) => React.ReactNode;
}

/**
 * Thin convenience wrapper. Renders nothing but a plain <div> with the
 * dialog props spread on — no styling, no positioning, no overlay. The
 * consumer's CSS decides what "lightbox" visually means.
 *
 * This component's mount/unmount IS the open/close signal (the consumer
 * conditionally renders <Lightbox /> at all, e.g. `{index !== null && ...}`).
 * So on mount it calls the underlying hook's own open(initialIndex) —
 * otherwise useLightbox's isOpen stays false forever since nothing else
 * would ever call open(). Consumers who want open/close to be driven some
 * other way should use useLightbox directly instead of this wrapper.
 */
export function Lightbox<T extends MediaLike>({
  renderContent,
  ...options
}: LightboxProps<T>) {
  const lightbox = useLightbox(options);
  const hasOpenedRef = useRef(false);

  useEffect(() => {
    if (!hasOpenedRef.current) {
      hasOpenedRef.current = true;
      lightbox.open(options.initialIndex ?? 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!lightbox.isOpen || !lightbox.activeItem) return null;

  return (
    <div {...lightbox.getDialogProps()}>{renderContent(lightbox.activeItem)}</div>
  );
}

export { useLightbox };