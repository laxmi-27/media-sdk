import { useEffect, useState } from "react";
import { MediaItem, MediaSDKError } from "media-core";
import { useMediaClient } from "./MediaProvider";

export interface UseMediaItemResult<T extends MediaItem> {
  item: T | null;
  loading: boolean;
  error: MediaSDKError | null;
}

export function useMediaItem<T extends MediaItem>(
  id: string | null,
  kind: "photo" | "video"
): UseMediaItemResult<T> {
  const client = useMediaClient();
  const [item, setItem] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<MediaSDKError | null>(null);

  useEffect(() => {
    if (!id) {
      setItem(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    const fetcher = kind === "photo" ? client.getPhoto(id) : client.getVideo(id);
    fetcher
      .then((result: MediaItem) => {
        if (!cancelled) setItem(result as T);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof MediaSDKError
              ? err
              : new MediaSDKError("Unknown fetch error", "unknown")
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [client, id, kind]);

  return { item, loading, error };
}
