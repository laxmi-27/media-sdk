import { useCallback, useEffect, useRef, useState } from "react";
import { MediaLike } from "../types";

export interface UseReelSwiperOptions<T extends MediaLike> {
  items: T[];
  onActiveChange?: (index: number, item: T) => void;
  /** fraction of an item that must be visible to count as "active", 0-1 */
  activeThreshold?: number;
}

export interface ContainerProps {
  ref: (node: HTMLElement | null) => void;
  style: { overflowY: "scroll"; scrollSnapType: "y mandatory" };
}

export interface ItemProps {
  ref: (node: Element | null) => void;
  style: { scrollSnapAlign: "start" };
  "data-reel-index": number;
}

export interface UseReelSwiperResult<T extends MediaLike> {
  activeIndex: number;
  activeItem: T | null;
  /** spread onto the scroll container */
  getContainerProps: () => ContainerProps;
  /** spread onto each item wrapper — MUST pass the item's index */
  getItemProps: (index: number) => ItemProps;
  scrollToIndex: (index: number) => void;
}

/**
 * Headless vertical snap-paging primitive (a "reels"-style feed). Detects
 * the active item via IntersectionObserver against the scroll container,
 * and returns prop-getters for scroll-snap CSS hooks — no visual styling
 * is applied beyond the scroll-snap mechanics themselves, which are
 * behavioral, not decorative.
 */
export function useReelSwiper<T extends MediaLike>(
  options: UseReelSwiperOptions<T>
): UseReelSwiperResult<T> {
  const { items, onActiveChange, activeThreshold = 0.6 } = options;
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLElement | null>(null);
  const itemNodesRef = useRef<Map<number, Element>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);

  const onActiveChangeRef = useRef(onActiveChange);
  onActiveChangeRef.current = onActiveChange;

  const setupObserver = useCallback(() => {
    if (!containerRef.current) return;
    observerRef.current?.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting && e.intersectionRatio >= activeThreshold)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible) {
          const index = Number((visible.target as HTMLElement).dataset.reelIndex);
          if (!Number.isNaN(index)) {
            setActiveIndex(index);
            const item = items[index];
            if (item) onActiveChangeRef.current?.(index, item);
          }
        }
      },
      { root: containerRef.current, threshold: [activeThreshold] }
    );

    itemNodesRef.current.forEach((node) => observerRef.current?.observe(node));
  }, [activeThreshold, items]);

  useEffect(() => {
    setupObserver();
    return () => observerRef.current?.disconnect();
  }, [setupObserver]);

  const getContainerProps = useCallback(
    (): ContainerProps => ({
      ref: (node) => {
        containerRef.current = node;
        setupObserver();
      },
      style: { overflowY: "scroll", scrollSnapType: "y mandatory" },
    }),
    [setupObserver]
  );

  const getItemProps = useCallback(
    (index: number): ItemProps => ({
      ref: (node) => {
        if (node) {
          itemNodesRef.current.set(index, node);
          observerRef.current?.observe(node);
        } else {
          itemNodesRef.current.delete(index);
        }
      },
      style: { scrollSnapAlign: "start" },
      "data-reel-index": index,
    }),
    []
  );

  const scrollToIndex = useCallback((index: number) => {
    const node = itemNodesRef.current.get(index);
    node?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return {
    activeIndex,
    activeItem: items[activeIndex] ?? null,
    getContainerProps,
    getItemProps,
    scrollToIndex,
  };
}
