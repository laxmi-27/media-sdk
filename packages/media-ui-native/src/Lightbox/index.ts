// SCOPING CUT (documented, not silent): media-ui-native's Lightbox and
// ReelSwiper are stubbed for this take-home. The web versions in
// media-ui-react are the reference implementation for the *pattern*
// (prop-getters, focus/active-index state, zero styling); porting them to
// RN (react-native-modal or a custom Modal + PanResponder for Lightbox,
// a FlatList with pagingEnabled + viewability callbacks for ReelSwiper)
// is mechanical but time-boxed out. Types are real and importable so
// consuming code/skills still typecheck against the intended contract.
import { MediaLike } from "../types";

export interface UseLightboxOptions<T extends MediaLike> {
  items: T[];
  initialIndex?: number;
  onClose?: () => void;
  onIndexChange?: (index: number, item: T) => void;
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
}

export function useLightbox<T extends MediaLike>(
  _options: UseLightboxOptions<T>
): UseLightboxResult<T> {
  throw new Error(
    "media-ui-native: Lightbox is not implemented in this take-home (see README scoping notes). " +
      "See media-ui-react's useLightbox for the reference pattern to port."
  );
}
