import { useEffect } from "react";
import { MediaEventMap } from "media-core";
import { useMediaClient } from "./MediaProvider";

export function useMediaEvents<K extends keyof MediaEventMap>(
  event: K,
  listener: (payload: MediaEventMap[K]) => void
): void {
  const client = useMediaClient();

  useEffect(() => {
    const unsubscribe = client.on(event, listener);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, event]);
}
