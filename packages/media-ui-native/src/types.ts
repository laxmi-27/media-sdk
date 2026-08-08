// Same local, source-agnostic contract as media-ui-react's MediaLike —
// kept independently defined (not imported cross-platform) so the two UI
// packages stay fully decoupled from each other, per the constraint that
// wrappers/components never import across siblings.
export interface MediaLike {
  id: string;
  thumbnailUrl: string;
  fullUrl: string;
  alt?: string;
  width?: number;
  height?: number;
  kind?: "photo" | "video";
}
