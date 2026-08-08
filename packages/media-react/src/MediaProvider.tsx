import React, { createContext, useContext, useMemo } from "react";
import { init, PexelsClient, MediaCoreConfig } from "media-core";

const MediaClientContext = createContext<PexelsClient | null>(null);

export interface MediaProviderProps {
  config: MediaCoreConfig;
  children: React.ReactNode;
}

/**
 * The single place auth config enters the React tree. Everything else
 * (useSearch, useMediaItem, useMediaEvents) reads the client from context —
 * no component below this ever sees the raw apiKey.
 */
export function MediaProvider({ config, children }: MediaProviderProps) {
  // one client instance per provider lifetime; config changes are rare
  // enough that identity-based memoization on the key is sufficient here
  const client = useMemo(() => init(config), [config.apiKey, config.source]);

  return (
    <MediaClientContext.Provider value={client}>{children}</MediaClientContext.Provider>
  );
}

export function useMediaClient(): PexelsClient {
  const client = useContext(MediaClientContext);
  if (!client) {
    throw new Error("useMediaClient must be used within a <MediaProvider>");
  }
  return client;
}
