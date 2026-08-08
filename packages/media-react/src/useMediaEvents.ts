import { useEffect } from "react";
import { MediaEventMap } from "media-core";
import { useMediaClient } from "./MediaProvider";

/**
 * Subscribe to SDK activity events from anywhere in the tree, independent
 * of the built-in console logger (which keeps running unless you call
 * client.disableDefaultLogger() yourself).
 */
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
