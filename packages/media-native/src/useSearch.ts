// Identical implementation to media-react's useSearch — RN and web share
// the exact same hook logic since neither touches platform APIs directly.
// Duplicated (not re-exported from media-react) to keep the two wrapper
// packages fully independent, per the "wrappers never import each other"
// constraint.
import { useCallback, useRef, useState } from "react";
import { MediaItem, MediaSDKError, Photo, Video } from "media-core";
import { useMediaClient } from "./MediaProvider";

export type SearchMode = "photos" | "videos";

export interface UseSearchOptions {
  mode?: SearchMode;
  perPage?: number;
}

export interface UseSearchResult<T extends MediaItem> {
  items: T[];
  loading: boolean;
  error: MediaSDKError | null;
  hasMore: boolean;
  search: (query: string) => void;
  loadMore: () => void;
}

export function useSearch<T extends MediaItem = Photo>(
  options: UseSearchOptions = {}
): UseSearchResult<T> {
  const { mode = "photos", perPage = 20 } = options;
  const client = useMediaClient();

  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<MediaSDKError | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const queryRef = useRef("");

  const runSearch = useCallback(
    async (query: string, targetPage: number, append: boolean) => {
      setLoading(true);
      setError(null);
      try {
        const response =
          mode === "photos"
            ? await client.searchPhotos({ query, page: targetPage, perPage })
            : await client.searchVideos({ query, page: targetPage, perPage });

        setItems((prev) =>
          (append ? [...prev, ...response.items] : response.items) as T[]
        );
        setPage(response.page);
        setHasMore(response.nextPage !== null);
      } catch (err) {
        setError(
          err instanceof MediaSDKError
            ? err
            : new MediaSDKError("Unknown search error", "unknown")
        );
      } finally {
        setLoading(false);
      }
    },
    [client, mode, perPage]
  );

  const search = useCallback(
    (query: string) => {
      queryRef.current = query;
      void runSearch(query, 1, false);
    },
    [runSearch]
  );

  const loadMore = useCallback(() => {
    if (!hasMore || loading) return;
    void runSearch(queryRef.current, page + 1, true);
  }, [hasMore, loading, page, runSearch]);

  return { items, loading, error, hasMore, search, loadMore };
}

export type UseVideoSearchResult = UseSearchResult<Video>;
