import React, { useMemo, useState } from "react";
import { MediaProvider, useSearch, useMediaClient } from "media-react";
import { Grid, Lightbox, ReelSwiper, MediaLike } from "media-ui-react";
import type { Photo, Video } from "media-core";

const API_KEY = import.meta.env.VITE_PEXELS_API_KEY as string | undefined;

// --- adapters: media-core's Photo/Video -> media-ui-react's source-agnostic
// MediaLike. This mapping is the ONE place in the whole system that knows
// both shapes at once, and it lives in the app, not in either package. ---
function photoToMediaLike(p: Photo): MediaLike {
  return {
    id: p.id,
    thumbnailUrl: p.src.medium,
    fullUrl: p.src.large,
    alt: p.alt || `Photo by ${p.photographer}`,
    width: p.width,
    height: p.height,
    kind: "photo",
  };
}

function videoToMediaLike(v: Video): MediaLike {
  const best = v.videoFiles.find((f) => f.quality === "hd") ?? v.videoFiles[0];
  return {
    id: v.id,
    thumbnailUrl: v.image,
    fullUrl: best?.link ?? v.image,
    alt: `Video by ${v.user.name}`,
    width: v.width,
    height: v.height,
    kind: "video",
  };
}

type Mode = "photos" | "videos";

function SearchScreen() {
  const [mode, setMode] = useState<Mode>("photos");
  const [query, setQuery] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showReels, setShowReels] = useState(false);

  const client = useMediaClient();
  const photoSearch = useSearch<Photo>({ mode: "photos" });
  const videoSearch = useSearch<Video>({ mode: "videos" });

  const active = mode === "photos" ? photoSearch : videoSearch;

  const mediaItems: MediaLike[] = useMemo(() => {
    return mode === "photos"
      ? photoSearch.items.map(photoToMediaLike)
      : videoSearch.items.map(videoToMediaLike);
  }, [mode, photoSearch.items, videoSearch.items]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    active.search(query);
    setShowReels(false);
  }

  function openLightboxAt(index: number) {
    const item = mode === "photos" ? photoSearch.items[index] : videoSearch.items[index];
    if (item) client.trackView(item);
    setLightboxIndex(index);
  }

  function handleDownloadClick(item: MediaLike) {
    const raw =
      mode === "photos"
        ? photoSearch.items.find((p) => p.id === item.id)
        : videoSearch.items.find((v) => v.id === item.id);
    if (raw) client.trackDownload(raw, item.fullUrl);
  }

  return (
    <div className="app">
      <header className="toolbar">
        <form onSubmit={handleSubmit} className="search-form">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search photos or videos…"
            aria-label="Search query"
          />
          <select value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
            <option value="photos">Photos</option>
            <option value="videos">Videos</option>
          </select>
          <button type="submit">Search</button>
        </form>
        {mode === "videos" && mediaItems.length > 0 && (
          <button onClick={() => setShowReels((v) => !v)}>
            {showReels ? "Grid view" : "Reels view"}
          </button>
        )}
      </header>

      {active.error && <p className="error">Error: {active.error.message}</p>}

      {mode === "videos" && showReels ? (
        <div className="reel-container">
          <ReelSwiper
            items={mediaItems}
            renderItem={(item, _index, isActive) => (
              <div className={`reel-item ${isActive ? "active" : ""}`}>
                {isActive ? (
                  <video src={item.fullUrl} autoPlay muted loop playsInline />
                ) : (
                  <img src={item.thumbnailUrl} alt={item.alt} />
                )}
              </div>
            )}
          />
        </div>
      ) : (
        <div className="grid">
          <Grid
            items={mediaItems}
            hasMore={active.hasMore}
            loading={active.loading}
            onLoadMore={active.loadMore}
            renderItem={(item) => {
              const index = mediaItems.findIndex((m) => m.id === item.id);
              return (
                <button
                  className="grid-tile"
                  onClick={() => openLightboxAt(index)}
                  aria-label={item.alt}
                >
                  <img src={item.thumbnailUrl} alt={item.alt} loading="lazy" />
                </button>
              );
            }}
          />
        </div>
      )}

      {active.loading && <p className="status">Loading…</p>}

      {lightboxIndex !== null && (
        <Lightbox
          items={mediaItems}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          renderContent={(item) => (
            <div className="lightbox-content">
              {item.kind === "video" ? (
                <video src={item.fullUrl} controls autoPlay />
              ) : (
                <img src={item.fullUrl} alt={item.alt} />
              )}
              <div className="lightbox-actions">
                <a
                  href={item.fullUrl}
                  download
                  onClick={() => handleDownloadClick(item)}
                >
                  Download
                </a>
                <button onClick={() => setLightboxIndex(null)} aria-label="Close">
                  Close
                </button>
              </div>
            </div>
          )}
        />
      )}
    </div>
  );
}

export default function App() {
  if (!API_KEY) {
    return (
      <div className="app-error">
        <p>
          Missing <code>VITE_PEXELS_API_KEY</code>. Copy <code>.env.example</code> to{" "}
          <code>.env</code> and add a free key from{" "}
          <a href="https://www.pexels.com/api/">pexels.com/api</a>.
        </p>
      </div>
    );
  }

  return (
    <MediaProvider config={{ apiKey: API_KEY, source: "pexels" }}>
      <SearchScreen />
    </MediaProvider>
  );
}
