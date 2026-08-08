import React from "react";
import { MediaLike } from "../types";
import { useReelSwiper, UseReelSwiperOptions } from "./useReelSwiper";

export interface ReelSwiperProps<T extends MediaLike> extends UseReelSwiperOptions<T> {
  renderItem: (item: T, index: number, isActive: boolean) => React.ReactNode;
}

/** Thin convenience wrapper — still zero visual styling beyond scroll-snap mechanics. */
export function ReelSwiper<T extends MediaLike>({
  items,
  renderItem,
  ...options
}: ReelSwiperProps<T>) {
  const swiper = useReelSwiper({ items, ...options });

  return (
    <div {...swiper.getContainerProps()}>
      {items.map((item, index) => (
        <div key={item.id} {...swiper.getItemProps(index)}>
          {renderItem(item, index, index === swiper.activeIndex)}
        </div>
      ))}
    </div>
  );
}
