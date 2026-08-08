import React from "react";
import { MediaLike } from "../types";
import { useLightbox, UseLightboxOptions } from "./useLightbox";

export interface LightboxProps<T extends MediaLike> extends UseLightboxOptions<T> {
  renderContent: (item: T) => React.ReactNode;
}

export function Lightbox<T extends MediaLike>(props: LightboxProps<T>) {
  const { renderContent, ...options } = props;
  const lightbox = useLightbox(options);
  void renderContent;
  void lightbox;
  return null;
}

export { useLightbox };
