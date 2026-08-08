// Deliberately minimal, LOCAL types — this package never imports from
// media-core. It doesn't know Pexels exists. Any component here works with
// any data source that shapes its items this way.
export interface MediaLike {
  id: string;
  thumbnailUrl: string;
  fullUrl: string;
  alt?: string;
  width?: number;
  height?: number;
  kind?: "photo" | "video";
}
