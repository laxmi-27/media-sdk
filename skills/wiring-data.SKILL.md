# Skill: Wiring media-react data (provider, hooks, auth, events)

Use this skill when writing or editing UI code in `apps/web-demo` (or any
new app) that needs to fetch Pexels photos/videos via `media-react`.

## Rule 1 — Auth only ever enters through `<MediaProvider>`

Never call `media-core`'s `init()` directly inside a component, and never
pass an API key as a prop to anything below the provider.

```tsx
// CORRECT — root of the app, once
<MediaProvider config={{ apiKey: import.meta.env.VITE_PEXELS_API_KEY, source: "pexels" }}>
  <App />
</MediaProvider>
```

```tsx
// WRONG — never do this inside a component
import { init } from "media-core";
const client = init({ apiKey: "..." }); // <- bypasses the provider, leaks the key into component logic
```

If a component needs the client directly (rare — normally you want a hook
instead), use `useMediaClient()`, never `init()`.

## Rule 2 — Which hook for which job

| Need | Hook | Do NOT |
|---|---|---|
| Search results + pagination | `useSearch({ mode: "photos" \| "videos" })` | Don't call `client.searchPhotos` directly in a component |
| Single item by id | `useMediaItem(id, "photo" \| "video")` | Don't refetch via `useSearch` for a single known id |
| React to SDK activity (analytics, badges, etc.) | `useMediaEvents("view" \| "download", handler)` | Don't attach listeners via `client.on()` directly in a `useEffect` — `useMediaEvents` already handles subscribe/unsubscribe lifecycle correctly |

`useSearch` returns `{ items, loading, error, hasMore, search, loadMore }`.
`search(query)` always resets to page 1; `loadMore()` appends. There is no
built-in debounce — if you want debounced search-as-you-type, debounce the
call to `search()` yourself in the component, not inside the hook.

## Rule 3 — Error handling shape

Every hook's `error` is a `MediaSDKError | null` with a `.code` of
`"network" | "auth" | "rate_limit" | "not_found" | "unknown"`. When
rendering error UI, branch on `.code`, not on `.message` string content —
messages are not a stable API.

```tsx
if (error?.code === "rate_limit") return <RateLimitBanner />;
if (error) return <GenericErrorBanner message={error.message} />;
```

## Rule 4 — Firing your own events vs. relying on the default logger

`client.trackView(item)` / `client.trackDownload(item, url)` emit the
`view`/`download` events. Call these explicitly from the app at the moment
of user intent (opening a lightbox = view, clicking download = download) —
`media-core` does NOT auto-fire these on fetch, because a search result
being fetched is not the same as a user actually viewing/downloading it.

The default console logger runs automatically. Call
`client.disableDefaultLogger()` once (e.g. in the provider's effect) only
if you're replacing it with your own analytics sink — don't call it
per-component.

## Rule 5 — Don't import `media-core` types into UI components

Components that render media should accept the `MediaLike` shape from
`media-ui-react`/`media-ui-native`, not `Photo`/`Video` from `media-core`.
Convert at the boundary (see `apps/web-demo/src/App.tsx`'s
`photoToMediaLike`/`videoToMediaLike`) — this is what keeps the UI package
decoupled from Pexels.
