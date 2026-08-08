# Headless Media SDK + Component Library

A framework-agnostic Pexels SDK core, thin React/React Native wrappers, an
independent headless component library per platform, and one demo app that
wires them together.

## Architecture

```
apps/web-demo  ──imports──▶  media-react ──imports──▶ media-core
      │                                                     ▲
      └──imports──▶ media-ui-react                    (never imported by
                     (never imports core or wrappers)   ui-react/ui-native)
```

- `media-core` — pure TypeScript. No React, no DOM manipulation, no RN
  imports. Auth key lives in a closure (`src/auth.ts`), never a public
  field. Typed Pexels client with search/curated/single-item fetch, an
  in-memory cache + request de-dupe, and a typed `download`/`view` event
  emitter with a default console logger.
- `media-react` / `media-native` — thin wrappers. Same hook contract
  (`useSearch`, `useMediaItem`, `useMediaEvents`, `MediaProvider`) on both
  platforms, deliberately duplicated rather than shared, so the two
  wrapper packages never import each other and stay independently
  swappable.
- `media-ui-react` / `media-ui-native` — headless components (`Grid`,
  `Lightbox`, `ReelSwiper`). Zero imports from `media-core` or either
  wrapper. Work off a local `MediaLike` type — they don't know Pexels
  exists. Hook-first API (`useGrid`, `useLightbox`, `useReelSwiper`)
  returning prop-getters; thin wrapper components are provided as
  convenience only.
- `apps/web-demo` — the one place that imports both `media-react` (data)
  and `media-ui-react` (display) and converts between `Photo`/`Video` and
  `MediaLike` at the boundary (`src/App.tsx`).
- `skills/` — two `SKILL.md` docs written to steer an AI coding assistant
  while building `apps/web-demo`: one for data wiring, one for consuming
  the components. See "How the skills were used" below.

### Dependency direction, enforced not just by convention

`.eslintrc.json` declares `eslint-plugin-boundaries` element types so a
stray `import ... from "media-core"` inside `media-ui-react` (or any other
disallowed edge) is a lint error, not something caught only at review time.

## Running it

```bash
pnpm install
cp apps/web-demo/.env.example apps/web-demo/.env   # add a free Pexels key
pnpm --filter media-core build
pnpm --filter media-react build
pnpm --filter media-ui-react build
pnpm --filter web-demo dev
```

## What's implemented vs. cut (documented scoping)

| Area | Status |
|---|---|
| `media-core`: search/curated/single-item, auth, cache/de-dupe, event emitter | Full |
| `media-react`: provider + 3 hooks | Full |
| `media-native`: same contract, mirrored | Full |
| `media-ui-react`: Grid, Lightbox (image), ReelSwiper | Full, headless, typechecked |
| Lightbox video support | Wired in the demo app via `renderContent`'s `kind` branch, not a separate component — video-in-lightbox is just a `<video>` in the same slot |
| `media-ui-native`: Grid | Full contract, `FlatList`-shaped hook (`onEndReached`/`onEndReachedThreshold`); the component itself renders `null` rather than importing `react-native` directly, so the package stays buildable/typecheckable without an RN toolchain in this environment — swap in `<FlatList {...flatListProps} />` in a real app |
| `media-ui-native`: Lightbox, ReelSwiper | **Cut.** Typed hook signatures exist and are exported (so consuming code and the skill docs still typecheck against the intended contract), but the implementation throws with a pointer to the `media-ui-react` reference implementation. Porting is mechanical (Modal+PanResponder / FlatList `pagingEnabled`+`onViewableItemsChanged`) but time-boxed out. |
| Disk-persisted cache | **Cut.** In-memory TTL + de-dupe only. |
| Tests | **Cut.** Given the time budget, prioritized a correctly-bounded architecture and a working app over test coverage. |

This is a senior-scoped take-home task attached to a JD that reads as a
1–2 year junior React role — the mismatch is real; I've scoped this
assuming the evaluation bar is the senior one described in the task doc.

## AI-assisted vs. hand-written

- **AI-assisted, then reviewed line-by-line:** initial scaffolding of all
  five packages (`package.json`/`tsconfig.json` boilerplate), the Pexels
  raw-response mapping functions in `media-core/src/client.ts`, and the
  ESLint boundaries config.
- **Hand-written / hand-designed:** the dependency-direction architecture
  itself, the event emitter design, the prop-getter API shape for the
  headless components (this is the part actually being evaluated, so it
  got the most direct attention), and both `SKILL.md` docs.
- Every package was typechecked (`tsc --noEmit`) after generation, and
  errors surfaced by the compiler (e.g. `MediaEventMap` not structurally
  satisfying the emitter's generic constraint, missing `DOM` lib entries
  for `fetch`/`URLSearchParams` in the otherwise-DOM-free core package)
  were fixed and are the reason the code compiles clean today, not
  assumed to be correct from generation.

## How the skills were used/tested

`skills/wiring-data.SKILL.md` and `skills/using-components.SKILL.md` were
written before wiring `apps/web-demo/src/App.tsx`, then used as the active
context while an AI coding assistant built that file. Concretely, the
skill's Rule 5 in `wiring-data.SKILL.md` ("don't import media-core types
into UI components — convert at the boundary") is what produced
`photoToMediaLike`/`videoToMediaLike` living in the app rather than the
assistant's first-instinct move of importing `Photo` directly into a
render function. [Link to the chat transcript demonstrating this: ADD LINK
BEFORE SUBMITTING]

## Submission checklist (fill in before sending)

- [ ] GitHub repo link
- [ ] Live deployed URL of the app
- [ ] Deployed URL of the SDK docs (e.g. Typedoc output for `media-core`)
- [ ] Deployed URL of the components docs (e.g. Storybook for `media-ui-react`)
- [ ] Link(s) to the ChatGPT/Claude discussion chats used while building
