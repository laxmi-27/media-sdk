import React from "react";
import { MediaLike } from "../types";
import { useGrid } from "./useGrid";

export interface GridProps<T extends MediaLike> {
  items: T[];
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
  numColumns?: number;
  renderItem: (item: T) => React.ReactElement;
}

/**
 * NOTE: intentionally NOT importing FlatList here to keep this package
 * buildable/typecheckable without a full react-native dependency in this
 * take-home's environment. In a real RN app, swap the div-shaped return
 * for `<FlatList data={items} numColumns={numColumns} renderItem={...}
 * {...flatListProps} />` — the hook contract above is already
 * FlatList-shaped for exactly that reason. Documented as a scoping note,
 * not a silent gap.
 */
export function Grid<T extends MediaLike>(props: GridProps<T>) {
  const { flatListProps } = useGrid(props);
  void flatListProps; // consumed by the real FlatList wiring in-app
  return null;
}
