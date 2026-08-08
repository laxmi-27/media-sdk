// See Lightbox/index.ts for the scoping-cut rationale — same applies here.
import { MediaLike } from "../types";

export interface UseReelSwiperOptions<T extends MediaLike> {
  items: T[];
  onActiveChange?: (index: number, item: T) => void;
}

export interface UseReelSwiperResult<T extends MediaLike> {
  activeIndex: number;
  activeItem: T | null;
}

export function useReelSwiper<T extends MediaLike>(
  _options: UseReelSwiperOptions<T>
): UseReelSwiperResult<T> {
  throw new Error(
    "media-ui-native: ReelSwiper is not implemented in this take-home (see README scoping notes). " +
      "See media-ui-react's useReelSwiper for the reference pattern to port (FlatList pagingEnabled + onViewableItemsChanged)."
  );
}
