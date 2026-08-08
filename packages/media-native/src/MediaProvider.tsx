import React, { createContext, useContext, useMemo } from "react";
import { init, PexelsClient, MediaCoreConfig } from "media-core";

// Same context/provider shape as media-react by design: the hook contract
// (names, arguments, return shapes) is identical across platforms so app
// code and the AI-tool skill docs transfer without a mental re-map.
const MediaClientContext = createContext<PexelsClient | null>(null);

export interface MediaProviderProps {
  config: MediaCoreConfig;
  children: React.ReactNode;
}

export function MediaProvider({ config, children }: MediaProviderProps) {
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
