import React from "react";
import { MediaLike } from "../types";
import { useGrid } from "./useGrid";

export interface GridProps<T extends MediaLike> {
  items: T[];
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
  renderItem: (item: T) => React.ReactNode;
}

/**
 * Optional thin convenience wrapper around useGrid — still ships zero CSS.
 * Consumers who want full control can skip this and call useGrid directly.
 */
export function Grid<T extends MediaLike>({
  items,
  onLoadMore,
  hasMore,
  loading,
  renderItem,
}: GridProps<T>) {
  const { getSentinelProps } = useGrid({ onLoadMore, hasMore, loading });

  return (
    <>
      {items.map((item) => (
        <React.Fragment key={item.id}>{renderItem(item)}</React.Fragment>
      ))}
      {hasMore && <div {...getSentinelProps()} data-media-grid-sentinel="" />}
    </>
  );
}
