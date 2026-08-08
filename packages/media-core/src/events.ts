export interface MediaEventMap {
  download: { id: string; kind: "photo" | "video"; url: string };
  view: { id: string; kind: "photo" | "video" };
  // index signature so MediaEventMap structurally satisfies the emitter's
  // Record<string, unknown> generic constraint while still giving the
  // named events above their precise payload types
  [key: string]: unknown;
}

type Listener<T> = (payload: T) => void;

/**
 * Minimal typed pub/sub emitter. Multiple independent listeners (e.g. the
 * default console logger AND an app-level analytics subscriber) can coexist
 * without stepping on each other.
 */
export class MediaEventEmitter<EventMap extends Record<string, unknown>> {
  private listeners: {
    [K in keyof EventMap]?: Set<Listener<EventMap[K]>>;
  } = {};

  on<K extends keyof EventMap>(event: K, listener: Listener<EventMap[K]>): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set();
    }
    this.listeners[event]!.add(listener);
    return () => this.off(event, listener);
  }

  off<K extends keyof EventMap>(event: K, listener: Listener<EventMap[K]>): void {
    this.listeners[event]?.delete(listener);
  }

  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
    this.listeners[event]?.forEach((listener) => listener(payload));
  }
}

export function createDefaultLogger(emitter: MediaEventEmitter<MediaEventMap>) {
  const unsubDownload = emitter.on("download", (payload) =>
    console.log("[media-core] download", payload)
  );
  const unsubView = emitter.on("view", (payload) =>
    console.log("[media-core] view", payload)
  );
  return () => {
    unsubDownload();
    unsubView();
  };
}
