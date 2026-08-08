import { MediaCoreConfig } from "./types";

/**
 * Holds the API key in a closure so it never becomes a public, inspectable
 * field on the client instance. Only createAuthHeaders() ever touches it.
 */
export function createAuthContext(config: MediaCoreConfig) {
  const apiKey = config.apiKey;
  const source = config.source ?? "pexels";

  if (!apiKey) {
    throw new Error("media-core: apiKey is required in init(config)");
  }

  function createAuthHeaders(): Record<string, string> {
    if (source === "pexels") {
      return { Authorization: apiKey };
    }
    return { Authorization: `Client-ID ${apiKey}` };
  }

  return { createAuthHeaders, source };
}
