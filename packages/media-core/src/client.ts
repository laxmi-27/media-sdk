// NOTE: tsconfig includes the "DOM" lib purely to get standard fetch/
// URLSearchParams/Response type declarations — this file never touches
// document, window, or any actual DOM API, so it stays portable to Node,
// React Native (with a fetch polyfill/global), or a CLI.
import { createAuthContext } from "./auth";
import { RequestCache } from "./cache";
import { MediaEventEmitter, MediaEventMap, createDefaultLogger } from "./events";
import {
  MediaCoreConfig,
  MediaSDKError,
  MediaItem,
  Photo,
  Video,
  PaginatedResponse,
  SearchParams,
} from "./types";

const PEXELS_BASE_URL = "https://api.pexels.com/v1";
const PEXELS_VIDEO_BASE_URL = "https://api.pexels.com/videos";

function mapStatusToErrorCode(status: number): MediaSDKError["code"] {
  if (status === 401 || status === 403) return "auth";
  if (status === 429) return "rate_limit";
  if (status === 404) return "not_found";
  if (status >= 500 || status === 0) return "network";
  return "unknown";
}

// --- raw Pexels response shapes, kept private to this file ---
interface RawPexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  avg_color: string;
  alt: string;
  src: {
    original: string;
    large: string;
    medium: string;
    small: string;
    tiny: string;
  };
}

interface RawPexelsVideo {
  id: number;
  width: number;
  height: number;
  url: string;
  image: string;
  duration: number;
  user: { name: string; url: string };
  video_files: Array<{
    id: number;
    quality: string;
    width: number;
    height: number;
    file_type: string;
    link: string;
  }>;
}

function mapPhoto(raw: RawPexelsPhoto): Photo {
  return {
    id: String(raw.id),
    width: raw.width,
    height: raw.height,
    url: raw.url,
    photographer: raw.photographer,
    photographerUrl: raw.photographer_url,
    avgColor: raw.avg_color,
    alt: raw.alt || "",
    src: {
      original: raw.src.original,
      large: raw.src.large,
      medium: raw.src.medium,
      small: raw.src.small,
      thumbnail: raw.src.tiny,
    },
    kind: "photo",
  };
}

function mapVideo(raw: RawPexelsVideo): Video {
  return {
    id: String(raw.id),
    width: raw.width,
    height: raw.height,
    url: raw.url,
    image: raw.image,
    duration: raw.duration,
    user: raw.user,
    videoFiles: raw.video_files.map((f) => ({
      id: f.id,
      quality: (["hd", "sd", "hls"].includes(f.quality) ? f.quality : "sd") as
        | "hd"
        | "sd"
        | "hls",
      width: f.width,
      height: f.height,
      fileType: f.file_type,
      link: f.link,
    })),
    kind: "video",
  };
}

/**
 * PexelsClient — the only class the rest of media-core (and, transitively,
 * the wrappers) talk to. Nothing outside this file knows the Pexels JSON
 * shape; everything downstream sees the normalized Photo/Video types.
 */
export class PexelsClient {
  private createAuthHeaders: () => Record<string, string>;
  private cache: RequestCache;
  private events = new MediaEventEmitter<MediaEventMap>();
  private removeDefaultLogger: () => void;

  constructor(config: MediaCoreConfig) {
    const auth = createAuthContext(config);
    this.createAuthHeaders = auth.createAuthHeaders;
    this.cache = new RequestCache();
    this.removeDefaultLogger = createDefaultLogger(this.events);
  }

  /** Subscribe to SDK activity events ('download' | 'view'). Returns an unsubscribe fn. */
  on: MediaEventEmitter<MediaEventMap>["on"] = (event, listener) =>
    this.events.on(event, listener);

  off: MediaEventEmitter<MediaEventMap>["off"] = (event, listener) =>
    this.events.off(event, listener);

  /** Call to silence the built-in console logger while keeping your own listeners. */
  disableDefaultLogger(): void {
    this.removeDefaultLogger();
  }

  trackDownload(item: MediaItem, url: string): void {
    this.events.emit("download", { id: item.id, kind: item.kind, url });
  }

  trackView(item: MediaItem): void {
    this.events.emit("view", { id: item.id, kind: item.kind });
  }

  private async request<T>(url: string): Promise<T> {
    return this.cache.dedupe(url, async () => {
      let res: Response;
      try {
        res = await fetch(url, { headers: this.createAuthHeaders() });
      } catch {
        throw new MediaSDKError("Network request failed", "network");
      }

      if (!res.ok) {
        throw new MediaSDKError(
          `Pexels request failed with status ${res.status}`,
          mapStatusToErrorCode(res.status),
          res.status
        );
      }

      return res.json() as Promise<T>;
    });
  }

  async searchPhotos(params: SearchParams): Promise<PaginatedResponse<Photo>> {
    const page = params.page ?? 1;
    const perPage = params.perPage ?? 20;
    const qs = new URLSearchParams({
      query: params.query,
      page: String(page),
      per_page: String(perPage),
      ...(params.orientation ? { orientation: params.orientation } : {}),
    });
    const data = await this.request<{
      photos: RawPexelsPhoto[];
      page: number;
      per_page: number;
      total_results: number;
      next_page?: string;
    }>(`${PEXELS_BASE_URL}/search?${qs.toString()}`);

    return {
      items: data.photos.map(mapPhoto),
      page: data.page,
      perPage: data.per_page,
      totalResults: data.total_results,
      nextPage: data.next_page ? data.page + 1 : null,
    };
  }

  async searchVideos(params: SearchParams): Promise<PaginatedResponse<Video>> {
    const page = params.page ?? 1;
    const perPage = params.perPage ?? 20;
    const qs = new URLSearchParams({
      query: params.query,
      page: String(page),
      per_page: String(perPage),
      ...(params.orientation ? { orientation: params.orientation } : {}),
    });
    const data = await this.request<{
      videos: RawPexelsVideo[];
      page: number;
      per_page: number;
      total_results: number;
      next_page?: string;
    }>(`${PEXELS_VIDEO_BASE_URL}/search?${qs.toString()}`);

    return {
      items: data.videos.map(mapVideo),
      page: data.page,
      perPage: data.per_page,
      totalResults: data.total_results,
      nextPage: data.next_page ? data.page + 1 : null,
    };
  }

  async curatedPhotos(page = 1, perPage = 20): Promise<PaginatedResponse<Photo>> {
    const qs = new URLSearchParams({ page: String(page), per_page: String(perPage) });
    const data = await this.request<{
      photos: RawPexelsPhoto[];
      page: number;
      per_page: number;
      total_results: number;
      next_page?: string;
    }>(`${PEXELS_BASE_URL}/curated?${qs.toString()}`);

    return {
      items: data.photos.map(mapPhoto),
      page: data.page,
      perPage: data.per_page,
      totalResults: data.total_results ?? data.photos.length,
      nextPage: data.next_page ? data.page + 1 : null,
    };
  }

  async popularVideos(page = 1, perPage = 20): Promise<PaginatedResponse<Video>> {
    const qs = new URLSearchParams({ page: String(page), per_page: String(perPage) });
    const data = await this.request<{
      videos: RawPexelsVideo[];
      page: number;
      per_page: number;
      total_results: number;
      next_page?: string;
    }>(`${PEXELS_VIDEO_BASE_URL}/popular?${qs.toString()}`);

    return {
      items: data.videos.map(mapVideo),
      page: data.page,
      perPage: data.per_page,
      totalResults: data.total_results ?? data.videos.length,
      nextPage: data.next_page ? data.page + 1 : null,
    };
  }

  async getPhoto(id: string): Promise<Photo> {
    const data = await this.request<RawPexelsPhoto>(`${PEXELS_BASE_URL}/photos/${id}`);
    return mapPhoto(data);
  }

  async getVideo(id: string): Promise<Video> {
    const data = await this.request<RawPexelsVideo>(`${PEXELS_VIDEO_BASE_URL}/videos/${id}`);
    return mapVideo(data);
  }
}

/** Entry point — the only way to construct a client. */
export function init(config: MediaCoreConfig): PexelsClient {
  return new PexelsClient(config);
}
