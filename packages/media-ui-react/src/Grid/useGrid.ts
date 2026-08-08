import { useCallback, useEffect, useRef } from "react";

export interface UseGridOptions {
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
  /** root margin passed straight to IntersectionObserver; tune for how early to trigger */
  rootMargin?: string;
}

export interface SentinelProps {
  ref: (node: Element | null) => void;
  "aria-hidden": true;
}

export interface UseGridResult {
  /** spread onto an element placed at the end of the grid to trigger loadMore */
  getSentinelProps: () => SentinelProps;
}

/**
 * Headless infinite-scroll primitive. Owns zero markup and zero styling —
 * it hands back a prop-getter for a sentinel element and wires an
 * IntersectionObserver internally. The consumer decides what the grid,
 * items, and sentinel actually render as.
 */
export function useGrid(options: UseGridOptions): UseGridResult {
  const { onLoadMore, hasMore, loading, rootMargin = "200px" } = options;
  const observerRef = useRef<IntersectionObserver | null>(null);
  const nodeRef = useRef<Element | null>(null);

  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;

  const attach = useCallback(
    (node: Element | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      nodeRef.current = node;
      if (!node) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry.isIntersecting) {
            onLoadMoreRef.current();
          }
        },
        { rootMargin }
      );
      observerRef.current.observe(node);
    },
    [rootMargin]
  );

  useEffect(() => {
    return () => observerRef.current?.disconnect();
  }, []);

  const getSentinelProps = useCallback((): SentinelProps => {
    return { ref: attach, "aria-hidden": true };
  }, [attach]);

  // hasMore/loading aren't used to change getSentinelProps' identity, but
  // are accepted so consumers can also gate rendering the sentinel at all
  // (e.g. `{hasMore && <div {...getSentinelProps()} />}`)
  void hasMore;
  void loading;

  return { getSentinelProps };
}
