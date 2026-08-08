import { useCallback, useRef } from "react";

export interface UseGridOptions {
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
  /** matches FlatList's onEndReachedThreshold semantics (0-1) */
  endReachedThreshold?: number;
}

export interface UseGridResult {
  /** spread directly onto a <FlatList> */
  flatListProps: {
    onEndReached: () => void;
    onEndReachedThreshold: number;
  };
}

/**
 * Headless infinite-scroll primitive for React Native. Same conceptual
 * contract as media-ui-react's useGrid (onLoadMore/hasMore/loading in,
 * something you spread onto the platform's native scroll primitive out) —
 * but FlatList already does threshold-based end-detection itself, so this
 * hook is a thin, honest adapter rather than reimplementing an
 * IntersectionObserver equivalent.
 */
export function useGrid(options: UseGridOptions): UseGridResult {
  const { onLoadMore, hasMore, loading, endReachedThreshold = 0.5 } = options;
  const firedRef = useRef(false);

  const onEndReached = useCallback(() => {
    if (!hasMore || loading || firedRef.current) return;
    firedRef.current = true;
    onLoadMore();
    // reset on next tick so a subsequent genuine end-reach can fire again
    setTimeout(() => {
      firedRef.current = false;
    }, 0);
  }, [hasMore, loading, onLoadMore]);

  return {
    flatListProps: { onEndReached, onEndReachedThreshold: endReachedThreshold },
  };
}
