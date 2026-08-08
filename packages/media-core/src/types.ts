// Pure data types. No React, no DOM, no React Native imports anywhere in this package.

export interface Photo {
  id: string;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographerUrl: string;
  avgColor: string;
  src: {
    original: string;
    large: string;
    medium: string;
    small: string;
    thumbnail: string;
  };
  alt: string;
  kind: "photo";
}

export interface VideoFile {
  id: number;
  quality: "hd" | "sd" | "hls";
  width: number;
  height: number;
  fileType: string;
  link: string;
}

export interface Video {
  id: string;
  width: number;
  height: number;
  url: string;
  image: string;
  duration: number;
  user: { name: string; url: string };
  videoFiles: VideoFile[];
  kind: "video";
}

export type MediaItem = Photo | Video;

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  perPage: number;
  totalResults: number;
  nextPage: number | null;
}

export interface SearchParams {
  query: string;
  page?: number;
  perPage?: number;
  orientation?: "landscape" | "portrait" | "square";
}

export type MediaSDKErrorCode =
  | "network"
  | "auth"
  | "rate_limit"
  | "not_found"
  | "unknown";

export class MediaSDKError extends Error {
  code: MediaSDKErrorCode;
  status?: number;

  constructor(message: string, code: MediaSDKErrorCode, status?: number) {
    super(message);
    this.name = "MediaSDKError";
    this.code = code;
    this.status = status;
  }
}

export interface MediaCoreConfig {
  apiKey: string;
  source?: "pexels" | "unsplash";
  baseUrl?: string;
}
